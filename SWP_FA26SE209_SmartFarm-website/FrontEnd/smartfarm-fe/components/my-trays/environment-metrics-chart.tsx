"use client";

import { useId, useMemo, useState, type ComponentType } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Droplets, Gauge, Sun, Thermometer, Waves } from "lucide-react";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TelemetryReading } from "@/lib/api";

type MetricKey = "temperature" | "airHumidity" | "soilHumidity" | "lightIntensity" | "waterLevel";

const metrics: Record<MetricKey, { label: string; color: string; icon: ComponentType<{ size?: number; className?: string }> }> = {
  temperature: { label: "Nhiệt độ", color: "#D97706", icon: Thermometer },
  airHumidity: { label: "Độ ẩm không khí", color: "#3B82F6", icon: Droplets },
  soilHumidity: { label: "Độ ẩm đất", color: "#8B5CF6", icon: Waves },
  lightIntensity: { label: "Cường độ sáng", color: "#4F8F68", icon: Sun },
  waterLevel: { label: "Mực nước", color: "#0891B2", icon: Gauge },
};

export function EnvironmentMetricsChart({ readings }: { readings: TelemetryReading[] }) {
  const availableMetrics = useMemo(() => (Object.keys(metrics) as MetricKey[]).filter((key) => readings.some((reading) => reading[key] !== null)), [readings]);
  const [metric, setMetric] = useState<MetricKey>(availableMetrics[0] ?? "temperature");
  const gradientId = useId().replaceAll(":", "");
  const selectedMetric = availableMetrics.includes(metric) ? metric : availableMetrics[0] ?? "temperature";

  if (readings.length === 0) return <section className="rounded-2xl border border-[#e8f3eb] bg-white p-10 text-center text-sm text-[#6b7280]">Chưa có chỉ số môi trường trong khoảng thời gian đã chọn.</section>;
  if (availableMetrics.length === 0) return <section className="rounded-2xl border border-[#e8f3eb] bg-white p-10 text-center text-sm text-[#6b7280]">Các bản ghi này chưa có chỉ số môi trường.</section>;

  const selected = metrics[selectedMetric];
  const values = readings.map((reading) => reading[selectedMetric]).filter((value): value is number => value !== null);
  const current = values.at(-1) ?? null;
  const minimum = values.length ? Math.min(...values) : null;
  const maximum = values.length ? Math.max(...values) : null;
  const chartData = readings.map((reading) => ({ ...reading, time: new Date(reading.recordedAt).toLocaleString("vi-VN") }));
  const chartConfig = { [selectedMetric]: { label: selected.label, color: selected.color } } satisfies ChartConfig;
  const display = (value: number | null) => value === null ? "Chưa có dữ liệu" : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

  return <section className="rounded-2xl border border-[#e8f3eb] bg-white p-4 sm:p-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><h2 className="text-xl font-bold">Lịch sử chỉ số môi trường</h2><p className="mt-1 text-sm text-[#6b7280]">Chọn một chỉ số để theo dõi sự thay đổi theo thời gian.</p></div><div role="tablist" aria-label="Chọn chỉ số" className="flex flex-wrap gap-1 rounded-xl bg-[#f3f8f4] p-1">{availableMetrics.map((key) => { const item = metrics[key]; const Icon = item.icon; return <button key={key} type="button" role="tab" aria-selected={selectedMetric === key} onClick={() => setMetric(key)} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold ${selectedMetric === key ? "bg-white text-[#1a2e1f] shadow-sm" : "text-[#6b7280]"}`}><Icon size={15} />{item.label}</button>; })}</div></div>
    <div className="mt-6 grid grid-cols-3 gap-3">{[{ label: "Mới nhất", value: display(current) }, { label: "Thấp nhất", value: display(minimum) }, { label: "Cao nhất", value: display(maximum) }].map((item) => <div key={item.label} className="rounded-xl bg-[#f8fbf9] p-4"><p className="text-xs text-[#6b7280]">{item.label}</p><p className="mt-2 font-bold tabular-nums">{item.value}</p></div>)}</div>
    <div className="mt-6 min-w-0"><ChartContainer config={chartConfig} className="h-[300px] w-full" initialDimension={{ width: 640, height: 300 }}><AreaChart accessibilityLayer data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={selected.color} stopOpacity={0.22} /><stop offset="100%" stopColor={selected.color} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8f3eb" strokeDasharray="4 4" /><XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} minTickGap={40} /><YAxis tickLine={false} axisLine={false} width={52} domain={["auto", "auto"]} tickFormatter={(value) => Number(value).toLocaleString("vi-VN")} /><ChartTooltip cursor={{ stroke: selected.color, strokeDasharray: "4 4" }} content={<ChartTooltipContent formatter={(value) => <span>{selected.label}: <strong>{display(Number(value))}</strong></span>} />} /><Area connectNulls dataKey={selectedMetric} name={selected.label} type="monotone" stroke={selected.color} strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={false} /></AreaChart></ChartContainer></div>
  </section>;
}
