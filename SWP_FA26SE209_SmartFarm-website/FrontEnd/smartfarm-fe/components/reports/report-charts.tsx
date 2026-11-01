"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyReport } from "./report-ui";

type ChartRow = { name: string; value: number };
type DonutRow = ChartRow & { color: string };

const number = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

export function ReportBarChart({ title, description, rows, color = "#4F8F68", format = number }: {
  title: string;
  description: string;
  rows: ChartRow[];
  color?: string;
  format?: (value: number) => string;
}) {
  const chartRows = [...rows].sort((a, b) => b.value - a.value).slice(0, 8);
  return <section aria-label={title} className="min-w-0 overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white">
    <div className="border-b border-[#EDF2EE] px-5 py-4"><h2 className="font-semibold text-[#173B29]">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
    {chartRows.some((row) => row.value > 0) ? <div className="px-3 py-5 sm:px-5">
      <ChartContainer config={{ value: { label: title, color } }} className="w-full" style={{ height: Math.max(230, chartRows.length * 42 + 55) }} initialDimension={{ width: 520, height: Math.max(230, chartRows.length * 42 + 55) }}>
        <BarChart accessibilityLayer layout="vertical" data={chartRows} margin={{ top: 4, right: 20, bottom: 2, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="#E8F0EA" strokeDasharray="4 4" />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))} />
          <YAxis type="category" dataKey="name" width={115} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip cursor={{ fill: "#F1F7F2" }} content={<ChartTooltipContent labelFormatter={(_, payload) => String(payload?.[0]?.payload?.name ?? "")} formatter={(value) => <span className="font-semibold">{format(Number(value))}</span>} />} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} maxBarSize={25} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      {rows.length > 8 && <p className="mt-2 text-center text-xs text-muted-foreground">Hiển thị 8 mục có giá trị cao nhất.</p>}
    </div> : <EmptyReport message="Chưa có số liệu để vẽ biểu đồ." />}
  </section>;
}

export function ReportDonutChart({ title, description, rows, format = number }: {
  title: string;
  description: string;
  rows: DonutRow[];
  format?: (value: number) => string;
}) {
  const chartRows = rows.filter((row) => row.value > 0);
  const total = chartRows.reduce((sum, row) => sum + row.value, 0);
  return <section aria-label={title} className="min-w-0 overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white">
    <div className="border-b border-[#EDF2EE] px-5 py-4"><h2 className="font-semibold text-[#173B29]">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
    {total > 0 ? <div className="grid items-center gap-2 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(130px,0.8fr)] sm:px-5">
      <div className="relative min-w-0">
        <ChartContainer config={{ value: { label: title, color: "#4F8F68" } }} className="h-[230px] w-full" initialDimension={{ width: 260, height: 230 }}>
          <PieChart accessibilityLayer>
            <Pie data={chartRows} dataKey="value" nameKey="name" innerRadius={67} outerRadius={96} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {chartRows.map((row) => <Cell key={row.name} fill={row.color} />)}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => String(payload?.[0]?.payload?.name ?? "")} formatter={(value) => <span className="font-semibold">{format(Number(value))}</span>} />} />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[11px] text-muted-foreground">Tổng cộng</span><strong className="mt-1 text-lg tabular-nums text-[#173B29]">{format(total)}</strong></div>
      </div>
      <ul className="space-y-3 text-sm">{rows.map((row) => <li key={row.name} className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} /><span className="min-w-0 flex-1 text-muted-foreground">{row.name}</span><strong className="tabular-nums">{format(row.value)}</strong></li>)}</ul>
    </div> : <EmptyReport message="Chưa có số liệu để vẽ biểu đồ." />}
  </section>;
}
