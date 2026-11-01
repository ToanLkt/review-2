"use client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyReport, ReportKpi, ReportNotice, reportTableHeader } from "./report-ui";
import { ReportBarChart, ReportDonutChart } from "./report-charts";
import { useReports } from "./reports-provider";

const orderLabels: Record<string, string> = { TRAY_RENTAL: "Thuê khay", SEED_PACKET: "Mua hạt giống" };
const statusLabels: Record<string, string> = { AWAITING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", PREPARING: "Đang chuẩn bị", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy" };
const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;

export function RevenueReport() {
  const { revenue } = useReports();
  if (!revenue) return <EmptyReport message="Chưa có dữ liệu doanh thu." />;
  const byType = Object.entries(revenue.revenueByOrderType);
  const byStatus = Object.entries(revenue.ordersByStatus);
  return <div className="space-y-6 p-5 sm:p-6">
    <section aria-label="Tổng hợp doanh thu" className="grid gap-4 md:grid-cols-3">
      <ReportKpi label="Tổng doanh thu" value={money(revenue.totalRevenue)} valueClassName="text-primary" />
      <ReportKpi label="Thanh toán thành công" value={String(revenue.successfulPayments)} />
      <ReportKpi label="Tổng số đơn" value={String(revenue.totalOrders)} valueClassName="text-blue-600" />
    </section>
    <ReportNotice>Doanh thu chỉ tính các khoản thanh toán thành công; giao dịch trùng lặp không được tính hai lần.</ReportNotice>
    <section aria-label="Biểu đồ doanh thu và đơn hàng" className="grid gap-6 lg:grid-cols-2">
      <ReportBarChart title="Doanh thu theo loại đơn" description="So sánh doanh thu trong khoảng thời gian đã chọn." rows={byType.map(([type, amount]) => ({ name: orderLabels[type] ?? type, value: amount }))} format={money} />
      <ReportDonutChart title="Cơ cấu trạng thái đơn hàng" description="Tỷ trọng số đơn theo trạng thái." rows={byStatus.map(([status, count], index) => ({ name: statusLabels[status] ?? status, value: count, color: ["#4F8F68", "#3B82F6", "#D9A441", "#8B93A1", "#E46F68", "#8B5CF6"][index % 6] }))} />
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <ReportTable title="Doanh thu theo loại đơn" empty="Chưa có doanh thu trong khoảng thời gian này." headings={["LOẠI ĐƠN", "DOANH THU"]} rows={byType.length}>
        {byType.map(([type, amount]) => <TableRow key={type} className="[&_td]:px-5 [&_td]:py-5"><TableCell><Badge variant="outline">{orderLabels[type] ?? type}</Badge></TableCell><TableCell className="text-right font-semibold tabular-nums">{money(amount)}</TableCell></TableRow>)}
      </ReportTable>
      <ReportTable title="Đơn hàng theo trạng thái" empty="Chưa có đơn hàng trong khoảng thời gian này." headings={["TRẠNG THÁI", "SỐ ĐƠN"]} rows={byStatus.length}>
        {byStatus.map(([status, count]) => <TableRow key={status} className="[&_td]:px-5 [&_td]:py-5"><TableCell>{statusLabels[status] ?? status}</TableCell><TableCell className="text-right font-semibold tabular-nums">{count}</TableCell></TableRow>)}
      </ReportTable>
    </section>
  </div>;
}

function ReportTable({ title, empty, headings, rows, children }: { title: string; empty: string; headings: string[]; rows: number; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border"><h2 className="border-b px-5 py-4 text-base font-semibold">{title}</h2>{rows ? <Table><TableHeader className={reportTableHeader}><TableRow>{headings.map((heading) => <TableHead key={heading} className="last:text-right">{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{children}</TableBody></Table> : <EmptyReport message={empty} />}</section>;
}
