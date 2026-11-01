"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DevicePanel } from "@/components/devices/device-ui";
import { Choice, Field } from "@/components/operations/shared/ui";
import type { ReportTab } from "@/lib/reports";
import { date } from "@/lib/formatters";
import { useReports } from "./reports-provider";

const reportLabels: Record<ReportTab, string> = { revenue: "Doanh thu", harvest: "Kết quả thu hoạch", inventory: "Tồn kho" };
const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
const csv = (rows: (string | number)[][]) => "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

export function ExportReportSheet({ initialTab, onClose, returnFocus }: { initialTab: ReportTab; onClose: () => void; returnFocus: () => void }) {
  const [type, setType] = useState<ReportTab>(initialTab);
  const [format, setFormat] = useState("csv");
  const { from, to, revenue, harvest, inventory } = useReports();
  function content() {
    if (type === "revenue" && revenue) return csv([["Khoảng thời gian", `${date(from)} - ${date(to)}`], ["Tổng doanh thu", revenue.totalRevenue], ["Thanh toán thành công", revenue.successfulPayments], ["Tổng số đơn", revenue.totalOrders], [], ["Loại đơn", "Doanh thu"], ...Object.entries(revenue.revenueByOrderType), [], ["Trạng thái đơn", "Số lượng"], ...Object.entries(revenue.ordersByStatus)]);
    if (type === "harvest" && harvest) return csv([["Khoảng thời gian", `${date(from)} - ${date(to)}`], ["Tổng chu kỳ", harvest.totalCycles], ["Đã thu hoạch", harvest.harvestedCycles], ["Thất bại", harvest.failedCycles], ["Tỷ lệ hoàn thành", `${harvest.completionRate}%`], [], ["Giống cây", "Tổng chu kỳ", "Đã thu hoạch"], ...harvest.bySupply.map((row) => [row.supplyName, row.totalCycles, row.harvestedCycles])]);
    if (type === "inventory" && inventory) return csv([["Tổng loại vật tư", inventory.totalSupplies], ["Sắp hết hàng", inventory.lowStockSupplies], ["Tổng trong kho", inventory.totalOnHand], ["Đã giữ", inventory.totalReserved], ["Có thể sử dụng", inventory.totalAvailable], [], ["Nhóm vật tư", "Số lượng có thể sử dụng"], ...Object.entries(inventory.availableBySupplyType)]);
    return null;
  }
  function download() {
    if (format === "pdf") { window.print(); toast.info("Đã mở hộp thoại in báo cáo."); onClose(); return; }
    const report = content(); if (!report) { toast.error("Chưa có dữ liệu để xuất báo cáo."); return; }
    const excel = format === "excel"; const blob = new Blob([excel ? report.replaceAll(",", "\t") : report], { type: excel ? "application/vnd.ms-excel;charset=utf-8" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `smartfarm-${type}-${from}-${to}.${excel ? "xls" : "csv"}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo.", { description: `${reportLabels[type]} · ${excel ? "Excel" : "CSV"}` }); onClose();
  }
  return <DevicePanel title="Xuất báo cáo" description="Chọn nội dung và định dạng tệp cần xuất." onClose={onClose} returnFocus={returnFocus} footer={<><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={download}><Download />Xuất báo cáo</Button></>}>
    <div className="space-y-5"><Field label="Loại báo cáo"><Choice label="Loại báo cáo" value={type} onChange={(value) => setType(value as ReportTab)} options={(Object.entries(reportLabels) as [ReportTab, string][]).map(([value, label]) => ({ value, label }))} /></Field>{type !== "inventory" && <p className="rounded-xl bg-[#F3F8F4] p-4 text-xs text-muted-foreground">Khoảng thời gian: {date(from)} đến {date(to)}</p>}<Field label="Định dạng"><Choice label="Định dạng" value={format} onChange={setFormat} options={[{ value: "excel", label: "Excel" }, { value: "pdf", label: "PDF" }, { value: "csv", label: "CSV" }]} /></Field></div>
  </DevicePanel>;
}
