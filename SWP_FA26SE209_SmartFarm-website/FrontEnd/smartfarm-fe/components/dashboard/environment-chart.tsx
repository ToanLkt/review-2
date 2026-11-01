"use client";
import { useState, useId, useEffect } from "react";
import {
  AreaChart,
  Area as ChartArea,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Thermometer, Droplets, Sun, Waves, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "./shared";
import { number, stamp, time } from "@/lib/formatters";
import { staffTelemetryService } from "@/lib/api/staff/staff-telemetry-instance";
import type { StaffTelemetryReading } from "@/lib/api/staff/staff-telemetry-service";
import type { DashboardDevice } from "@/lib/dashboard-live-data";
import type { DateRange } from "react-day-picker";
const metrics = {
  temperature: { label: "Nhiệt độ", unit: "°C" },
  humidity: { label: "Độ ẩm", unit: "%" },
  light: { label: "Ánh sáng", unit: "lux" },
};
export function EnvironmentChart({
  globalArea,
  range,
  devices,
  areas,
}: {
  globalArea: string;
  range: DateRange | undefined;
  devices: DashboardDevice[];
  areas: string[];
}) {
  const [localArea, setLocalArea] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [metric, setMetric] = useState<keyof typeof metrics>("temperature");
  const [period, setPeriod] = useState("24 giờ");
  const [history, setHistory] = useState<{ key: string; items: StaffTelemetryReading[] }>({ key: "", items: [] });
  const id = useId().replaceAll(":", "");
  const area = globalArea === "Tất cả khu vực" ? (localArea || areas[0]) : globalArea;
  const available = devices.filter((d) => d.area === area);
  const device = available.find((d) => d.id === deviceId) ?? available[0];
  const config = metrics[metric];
  const trayId = device?.trayId;
  const from = range?.from?.getTime();
  const to = range?.to?.getTime();
  const historyKey = `${trayId ?? ""}-${from ?? ""}-${to ?? ""}-${period}`;
  useEffect(() => {
    if (!trayId) return;
    let cancelled = false;
    const current = new Date();
    const end = to ? new Date(Math.min(to + 86400000 - 1, current.getTime())) : current;
    const start = period === "24 giờ" ? new Date(end.getTime() - 86400000) : new Date(end.getTime() - 7 * 86400000);
    if (from && from > start.getTime()) start.setTime(from);
    staffTelemetryService.history(trayId, { from: start, to: end, page: 1, pageSize: 100 })
      .then((result) => { if (!cancelled) setHistory({ key: historyKey, items: result.items }); })
      .catch(() => { if (!cancelled) setHistory({ key: historyKey, items: [] }); });
    return () => { cancelled = true; };
  }, [trayId, from, to, period, historyKey]);
  const points = (history.key === historyKey ? history.items : []).map((reading) => ({
    at: reading.recordedAt,
    label: period === "24 giờ" ? time(reading.recordedAt) : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(reading.recordedAt)),
    value: metric === "humidity" ? reading.airHumidity : metric === "light" ? reading.lightIntensity : reading.temperature,
  })).filter((point): point is { at: string; label: string; value: number } => point.value !== null).sort((a, b) => a.at.localeCompare(b.at));
  return (
    <Card className="section-card min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div>
          <h2 className="section-title">Giám sát môi trường</h2>
          <p className="subtle mt-1">Điều kiện sinh trưởng trong khu vực</p>
        </div>
        <div className="flex gap-2">
          {globalArea === "Tất cả khu vực" ? (
            <FilterSelect
              label="Khu vực biểu đồ"
              value={localArea}
              onChange={setLocalArea}
              options={areas.length ? areas : ["Chưa có khu vực"]}
            />
          ) : (
            <Badge variant="outline">{area}</Badge>
          )}
          <FilterSelect
            label="Cảm biến theo dõi"
            value={device?.id ?? ""}
            onChange={setDeviceId}
            options={available.map((d) => d.id)}
          />
        </div>
      </div>
      <div className="mx-5 grid grid-cols-2 gap-4 rounded-xl bg-muted/80 p-4 sm:grid-cols-4">
        {[
          {
            icon: Thermometer,
            label: "Nhiệt độ",
              value: device?.temperature == null ? "—" : `${number(device.temperature)}°C`,
          },
          {
            icon: Droplets,
            label: "Độ ẩm không khí",
              value: device?.humidity == null ? "—" : `${number(device.humidity)}%`,
          },
          {
            icon: Sun,
            label: "Ánh sáng",
              value: device?.light == null ? "—" : `${number(device.light)} lux`,
          },
          { icon: Waves, label: "Mực nước", value: device?.waterLevel == null ? "—" : `${number(device.waterLevel)}%` },
        ].map((r) => (
          <div key={r.label}>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <r.icon className="size-3.5" />
              {r.label}
            </p>
            <p
              className={`font-semibold ${r.label === "Mực nước" ? "text-sm text-primary" : "text-lg"}`}
            >
              {r.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <Tabs
          value={metric}
          onValueChange={(v) => setMetric(v as keyof typeof metrics)}
        >
          <TabsList className="h-8 bg-muted">
            {Object.entries(metrics).map(([key, m]) => (
              <TabsTrigger className="text-[11px]" key={key} value={key}>
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <FilterSelect
          label="Độ dài biểu đồ"
          value={period}
          onChange={setPeriod}
          options={["24 giờ", "7 ngày"]}
        />
      </div>
      <p className="subtle px-5 pt-3">
        {config.label} ({config.unit}) · Dữ liệu theo khoảng ngày
      </p>
      {points.length ? (
        <ChartContainer
          config={{ value: { label: config.label, color: "#4F8F68" } }}
          className="mt-2 h-[195px] w-full pr-5"
        >
          <AreaChart
            accessibilityLayer
            data={points}
            margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F8F68" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#4F8F68" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={25}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => number(Number(v))}
              domain={["auto", "auto"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) => (
                    <span>
                      {config.label}:{" "}
                      <strong>
                        {number(Number(v))} {config.unit}
                      </strong>
                    </span>
                  )}
                />
              }
            />
            <ChartArea
              dataKey="value"
              type="monotone"
              stroke="#4F8F68"
              strokeWidth={2.2}
              fill={`url(#${id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[195px] items-center justify-center text-sm text-muted-foreground">
          Không có dữ liệu trong khoảng ngày đã chọn.
        </div>
      )}
      <div className="mx-5 mt-3 flex flex-wrap items-center gap-2 border-t py-3 text-[10px] text-muted-foreground">
        <Clock3 className="size-3" />
        <span>Số đo gần nhất: {device?.received ? stamp(device.received) : "—"}</span>
        {device && !device.online && (
          <Badge className="status-amber text-[10px]">Dữ liệu cũ</Badge>
        )}
        <span className="ml-auto">Cảm biến · {device?.id ?? "—"}</span>
      </div>
    </Card>
  );
}
