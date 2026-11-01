"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyReport, ReportKpi, ReportNotice, reportTableHeader } from "./report-ui";
import { ReportBarChart, ReportDonutChart } from "./report-charts";
import { useReports } from "./reports-provider";

export function HarvestReport() {
  const { harvest } = useReports();
  if (!harvest) return <EmptyReport message="Chưa có dữ liệu thu hoạch." />;
  return <div className="space-y-6 p-5 sm:p-6">
    <section aria-label="Tổng hợp thu hoạch" className="grid gap-4 md:grid-cols-4">
      <ReportKpi label="Tổng chu kỳ" value={String(harvest.totalCycles)} />
      <ReportKpi label="Đã thu hoạch" value={String(harvest.harvestedCycles)} valueClassName="text-primary" />
      <ReportKpi label="Thất bại" value={String(harvest.failedCycles)} valueClassName="text-red-600" />
      <ReportKpi label="Tỷ lệ hoàn thành" value={`${harvest.completionRate.toLocaleString("vi-VN")}%`} valueClassName="text-blue-600" />
    </section>
    <ReportNotice>Chu kỳ được tổng hợp theo ngày bắt đầu trong khoảng thời gian đã chọn.</ReportNotice>
    <section aria-label="Biểu đồ thu hoạch" className="grid gap-6 lg:grid-cols-2">
      <ReportBarChart title="Chu kỳ theo giống cây" description="Tổng chu kỳ của từng giống cây." rows={harvest.bySupply.map((row) => ({ name: row.supplyName || "Chưa đặt tên", value: row.totalCycles }))} />
      <ReportDonutChart title="Kết quả chu kỳ" description="Tỷ trọng chu kỳ đã thu hoạch, thất bại và đang thực hiện." rows={[{ name: "Đã thu hoạch", value: harvest.harvestedCycles, color: "#4F8F68" }, { name: "Thất bại", value: harvest.failedCycles, color: "#E46F68" }, { name: "Đang thực hiện", value: Math.max(0, harvest.totalCycles - harvest.harvestedCycles - harvest.failedCycles), color: "#D9A441" }]} />
    </section>
    <section className="overflow-hidden rounded-2xl border"><h2 className="border-b px-5 py-4 text-base font-semibold">Kết quả theo giống cây</h2>
      {harvest.bySupply.length ? <Table><TableHeader className={reportTableHeader}><TableRow><TableHead>GIỐNG CÂY</TableHead><TableHead className="text-right">TỔNG CHU KỲ</TableHead><TableHead className="text-right">ĐÃ THU HOẠCH</TableHead><TableHead className="text-right">TỶ LỆ</TableHead></TableRow></TableHeader><TableBody>{harvest.bySupply.map((row) => { const rate = row.totalCycles ? row.harvestedCycles * 100 / row.totalCycles : 0; return <TableRow key={row.supplyId} className="[&_td]:px-5 [&_td]:py-5"><TableCell className="font-semibold">{row.supplyName || "Chưa đặt tên"}</TableCell><TableCell className="text-right tabular-nums">{row.totalCycles}</TableCell><TableCell className="text-right tabular-nums">{row.harvestedCycles}</TableCell><TableCell className="text-right font-semibold tabular-nums text-primary">{rate.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%</TableCell></TableRow>; })}</TableBody></Table> : <EmptyReport message="Chưa có chu kỳ trồng trong khoảng thời gian này." />}
    </section>
  </div>;
}
