"use client";

import { LoadingState, TableSkeleton } from "@/components/ui/loading-state";

import { useEffect, useState } from "react";
import { Activity, Droplets, Gauge, RefreshCw, Sun, Thermometer, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnvironmentMetricsChart } from "@/components/my-trays/environment-metrics-chart";
import { ApiError } from "@/lib/api/client";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { IoTDevice } from "@/lib/api/staff/staff-iot-service";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import type { SoilTray } from "@/lib/api/staff/staff-farm-service";
import { staffTelemetryService } from "@/lib/api/staff/staff-telemetry-instance";
import type { StaffTelemetryHistory, StaffTelemetryReading } from "@/lib/api/staff/staff-telemetry-service";

const emptyHistory: StaffTelemetryHistory = {
  items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
};

export function StaffTelemetry() {
  const [device, setDevice] = useState<IoTDevice | null>(null);
  const [deviceError, setDeviceError] = useState("");
  const [trays, setTrays] = useState<SoilTray[]>([]);
  const [trayId, setTrayId] = useState("");
  const [traysLoading, setTraysLoading] = useState(true);
  const [traysError, setTraysError] = useState("");
  const [latest, setLatest] = useState<StaffTelemetryReading | null>(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestError, setLatestError] = useState("");
  const [history, setHistory] = useState(emptyHistory);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    staffFarmService.trays()
      .then((data) => {
        if (!cancelled) {
          setTrays(data);
          setTrayId((current) => current || (data[0] ? String(data[0].soilTrayId) : ""));
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setTraysError(messageOf(reason, "Không thể tải danh sách khay."));
      })
      .finally(() => { if (!cancelled) setTraysLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!trayId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) { setLatestLoading(true); setLatestError(""); setLatest(null); }
    });
    staffTelemetryService.latest(Number(trayId))
      .then((data) => { if (!cancelled) setLatest(data); })
      .catch((reason: unknown) => {
        if (!cancelled) setLatestError(reason instanceof ApiError && reason.status === 404
          ? "Khay này chưa có dữ liệu telemetry."
          : messageOf(reason, "Không thể tải telemetry mới nhất."));
      })
      .finally(() => { if (!cancelled) setLatestLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey, trayId]);

  useEffect(() => {
    if (!trayId) return;
    let cancelled = false;
    if (from && to && from > to) {
      queueMicrotask(() => {
        if (!cancelled) {
          setHistory(emptyHistory);
          setHistoryError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
          setHistoryLoading(false);
        }
      });
      return () => { cancelled = true; };
    }
    queueMicrotask(() => { if (!cancelled) { setHistoryLoading(true); setHistoryError(""); } });
    staffTelemetryService.history(Number(trayId), {
      from: from ? localDate(from, false) : undefined,
      to: to ? localDate(to, true) : undefined,
      page, pageSize: 20,
    }).then((data) => { if (!cancelled) setHistory(data); })
      .catch((reason: unknown) => {
        if (!cancelled) setHistoryError(messageOf(reason, "Không thể tải lịch sử telemetry."));
      })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [from, page, reloadKey, to, trayId]);

  useEffect(() => {
    let cancelled=false;
    queueMicrotask(()=>{if(!cancelled){setDevice(null);setDeviceError("");}});
    if(latest) staffIoTService.device(latest.deviceId).then(value=>{if(!cancelled)setDevice(value);}).catch(()=>{if(!cancelled)setDeviceError("Không xác minh được trạng thái kết nối.");});
    return()=>{cancelled=true;};
  },[latest]);
  const selectedTray = trays.find((tray) => String(tray.soilTrayId) === trayId);
  const chartReadings = [...history.items].reverse();

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / Telemetry</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Giám sát môi trường</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi số đo cảm biến mới nhất và lịch sử theo từng khay.</p></div>
      <Button variant="outline" disabled={latestLoading || historyLoading} onClick={() => setReloadKey((value) => value + 1)}><RefreshCw className={latestLoading || historyLoading ? "animate-spin" : ""} />Làm mới</Button>
    </header>

    <section className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm">
      {traysError ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{traysError}</div> : <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <label className="space-y-1.5 text-sm font-medium"><span>Khay trồng</span><Select disabled={traysLoading || !trays.length} value={trayId} onValueChange={(value) => { setTrayId(value); setPage(1); }}><SelectTrigger><SelectValue placeholder={traysLoading ? "Đang tải khay..." : "Chọn khay"} /></SelectTrigger><SelectContent>{trays.map((tray) => <SelectItem key={tray.soilTrayId} value={String(tray.soilTrayId)}>{tray.trayCode} · tầng {tray.tierIndex}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-1.5 text-sm font-medium"><span>Từ ngày</span><Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
        <label className="space-y-1.5 text-sm font-medium"><span>Đến ngày</span><Input type="date" min={from || undefined} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
      </div>}
    </section>

    {!traysLoading && !traysError && !trays.length ? <Empty text="Chưa có khay để theo dõi telemetry." /> : trayId && <>
      <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF2EE] px-5 py-4"><div><h2 className="font-semibold text-[#173B29]">Số đo mới nhất · {selectedTray?.trayCode || "Khay đã chọn"}</h2>{latest && <p className="mt-1 text-xs text-muted-foreground">Thiết bị {latest.deviceCode} · ghi nhận {formatStamp(latest.recordedAt)}</p>}</div>{latest && <Badge variant="outline" className={latest.isStale ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{latest.isStale ? "Dữ liệu đã cũ" : "Dữ liệu mới"}</Badge>}</div>
        {latest && <div role="status" className={`border-b p-4 text-sm ${latest.isStale || device?.status === "OFFLINE" ? "bg-amber-50 text-amber-900" : "bg-slate-50"}`}><p className="font-semibold">Đo thực tế lúc {formatStamp(latest.recordedAt)}</p>{latest.isStale && <p>Dữ liệu đã cũ — không dùng số đo này để kết luận tình trạng hiện tại.</p>}<p>{device ? device.status === "ONLINE" ? "Thiết bị đang kết nối" : device.status === "OFFLINE" ? "Thiết bị mất kết nối" : "Thiết bị đã ngừng hoạt động" : deviceError || "Đang kiểm tra kết nối..."}</p>{device?.lastSeen && <p>Liên lạc gần nhất: {formatStamp(device.lastSeen)}</p>}</div>}
        {latestLoading ? <LoadingState label="Đang tải số đo mới nhất..." className="min-h-40" />
        : latestError ? <div className="bg-amber-50 p-8 text-center text-sm text-amber-800">{latestError}</div>
        : latest && <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Thermometer} label="Nhiệt độ" value={latest.temperature} unit="°C" />
          <Metric icon={Droplets} label="Độ ẩm không khí" value={latest.airHumidity} unit="%" />
          <Metric icon={Waves} label="Độ ẩm đất" value={latest.soilHumidity} unit="%" />
          <Metric icon={Sun} label="Cường độ ánh sáng" value={latest.lightIntensity} unit="lux" />
          <Metric icon={Gauge} label="Mực nước" value={latest.waterLevel} unit="%" />
        </div>}
      </section>

      {historyError ? <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center"><p className="font-semibold text-red-700">Không thể tải lịch sử telemetry</p><p className="mt-1 text-sm text-red-600">{historyError}</p></div>
      : historyLoading ? <div className="rounded-2xl border border-[#E1ECE4] bg-white"><TableSkeleton rows={6} columns={8} /></div>
      : <>
        <EnvironmentMetricsChart readings={chartReadings} />
        <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
          <div className="border-b border-[#EDF2EE] px-5 py-4"><h2 className="font-semibold text-[#173B29]">Bản ghi telemetry</h2><p className="mt-1 text-xs text-muted-foreground">{history.totalItems} bản ghi trong khoảng đã chọn.</p></div>
          {history.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Thiết bị</th><th className="px-5 py-4">Nhiệt độ</th><th className="px-5 py-4">Ẩm không khí</th><th className="px-5 py-4">Ẩm đất</th><th className="px-5 py-4">Ánh sáng</th><th className="px-5 py-4">Mực nước</th><th className="px-5 py-4">Độ mới</th></tr></thead><tbody>{history.items.map((item) => <tr key={item.telemetryId} className="border-t border-[#EDF2EE]"><td className="px-5 py-4 whitespace-nowrap">{formatStamp(item.recordedAt)}</td><td className="px-5 py-4 font-medium">{item.deviceCode}</td><ValueCell value={item.temperature} unit="°C" /><ValueCell value={item.airHumidity} unit="%" /><ValueCell value={item.soilHumidity} unit="%" /><ValueCell value={item.lightIntensity} unit="lux" /><ValueCell value={item.waterLevel} unit="%" /><td className="px-5 py-4"><Badge variant="outline" className={item.isStale ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{item.isStale ? "Cũ" : "Mới"}</Badge></td></tr>)}</tbody></table></div> : <Empty text="Chưa có telemetry trong khoảng thời gian đã chọn." />}
          {history.totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EE] px-5 py-4"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trang trước</Button><span className="text-sm text-muted-foreground">{page} / {history.totalPages}</span><Button size="sm" variant="outline" disabled={page >= history.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div>}
        </section>
      </>}
    </>}
  </div>;
}

function localDate(value: string, endOfDay: boolean) {
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
}
function messageOf(reason: unknown, fallback: string) { return reason instanceof Error ? reason.message : fallback; }
function formatStamp(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN"); }
function displayValue(value: number | null) { return value === null ? "—" : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 }); }

function Metric({ icon: Icon, label, value, unit }: { icon: typeof Activity; label: string; value: number | null; unit: string }) {
  return <Card className="border-[#EDF2EE] shadow-none"><CardContent className="p-4"><Icon className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold text-[#173B29]">{displayValue(value)} {value !== null && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}</p></CardContent></Card>;
}
function ValueCell({ value, unit }: { value: number | null; unit: string }) { return <td className="px-5 py-4 tabular-nums">{displayValue(value)}{value !== null && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}</td>; }
function Empty({ text }: { text: string }) { return <div className="p-14 text-center"><Activity className="mx-auto size-10 text-[#8BAF9A]" /><p className="mt-3 text-sm text-muted-foreground">{text}</p></div>; }
