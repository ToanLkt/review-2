"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyReport, ReportKpi, ReportNotice, reportTableHeader } from "./report-ui";
import { ReportBarChart, ReportDonutChart } from "./report-charts";
import { useReports } from "./reports-provider";

const typeLabels: Record<string, string> = { SEED: "Hạt giống", SOIL_SUBSTRATE: "Giá thể", PACKAGING: "Bao bì", EQUIPMENT: "Thiết bị" };
export function InventoryReport() {
  const { inventory } = useReports();
  if (!inventory) return <EmptyReport message="Chưa có dữ liệu tồn kho." />;
  const rows = Object.entries(inventory.availableBySupplyType);
  return <div className="space-y-6 p-5 sm:p-6">
    <section aria-label="Tổng hợp tồn kho" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <ReportKpi label="Loại vật tư" value={String(inventory.totalSupplies)} /><ReportKpi label="Sắp hết hàng" value={String(inventory.lowStockSupplies)} valueClassName="text-red-600" /><ReportKpi label="Tổng trong kho" value={inventory.totalOnHand.toLocaleString("vi-VN")} /><ReportKpi label="Đã giữ" value={inventory.totalReserved.toLocaleString("vi-VN")} valueClassName="text-blue-600" /><ReportKpi label="Có thể sử dụng" value={inventory.totalAvailable.toLocaleString("vi-VN")} valueClassName="text-primary" />
    </section>
    <ReportNotice>Số lượng có thể sử dụng bằng tổng trong kho sau khi trừ phần đã được giữ cho các đơn hiện tại.</ReportNotice>
    <section aria-label="Biểu đồ tồn kho" className="grid gap-6 lg:grid-cols-2">
      <ReportBarChart title="Có thể sử dụng theo nhóm" description="So sánh số lượng hiện có của từng nhóm vật tư." rows={rows.map(([type, amount]) => ({ name: typeLabels[type] ?? type, value: amount }))} />
      <ReportDonutChart title="Phân bổ tồn kho" description="Số lượng có thể sử dụng và đã giữ cho đơn hàng." rows={[{ name: "Có thể sử dụng", value: inventory.totalAvailable, color: "#4F8F68" }, { name: "Đã giữ", value: inventory.totalReserved, color: "#D9A441" }]} />
    </section>
    <section className="overflow-hidden rounded-2xl border"><h2 className="border-b px-5 py-4 text-base font-semibold">Số lượng có thể sử dụng theo nhóm</h2>{rows.length ? <Table><TableHeader className={reportTableHeader}><TableRow><TableHead>NHÓM VẬT TƯ</TableHead><TableHead className="text-right">SỐ LƯỢNG</TableHead></TableRow></TableHeader><TableBody>{rows.map(([type, amount]) => <TableRow key={type} className="[&_td]:px-5 [&_td]:py-5"><TableCell className="font-semibold">{typeLabels[type] ?? type}</TableCell><TableCell className="text-right font-semibold tabular-nums text-primary">{amount.toLocaleString("vi-VN")}</TableCell></TableRow>)}</TableBody></Table> : <EmptyReport message="Chưa có số liệu tồn kho theo nhóm." />}</section>
  </div>;
}
