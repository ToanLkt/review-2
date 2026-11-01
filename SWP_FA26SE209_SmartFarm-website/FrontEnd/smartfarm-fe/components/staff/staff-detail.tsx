"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, PackageCheck, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/formatters";
import { staffOrders, staffOrderTotal } from "./staff-order-data";

export function StaffDetail({ type, id }: { type: "orders" | "cycles"; id: string }) {
  const isOrder = type === "orders";
  const order = isOrder ? staffOrders.find((item) => item.id === id) : undefined;

  if (isOrder && !order) return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] px-4 py-12 text-center">
    <PackageCheck className="mx-auto size-10 text-[#8BAF9A]" />
    <h1 className="mt-4 text-xl font-bold">Không tìm thấy đơn hàng</h1>
    <p className="mt-2 text-sm text-muted-foreground">Mã đơn này không có trong danh sách được phân công.</p>
    <Button asChild variant="outline" className="mt-5"><Link href="/staff/orders">Quay lại danh sách</Link></Button>
  </main>;

  const title = isOrder ? "Chi tiết đơn hàng" : "Chi tiết chu kỳ trồng";
  const rows = order ? [
    ["Khách hàng", order.customer],
    ["Số điện thoại", order.phone],
    ["Địa chỉ / điểm nhận", order.address],
    ["Thanh toán", order.payment],
    ["Giao hàng", order.delivery],
  ] : [
    ["Loại rau", "Rau mầm cải xanh"],
    ["Khay", "B-08"],
    ["Khu vực", "Khu B"],
    ["Ngày bắt đầu", "09/09/2026"],
    ["Dự kiến thu hoạch", "14/09/2026"],
    ["Giai đoạn", "Ươm mầm"],
  ];

  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]">
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 -ml-3"><Link href={`/staff/${type}`}><ArrowLeft />Quay lại</Link></Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{isOrder ? "Kinh doanh / Đơn hàng" : "Vận hành / Chu kỳ"}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{isOrder ? "Thông tin khách hàng, sản phẩm và tiến độ thực hiện." : "Chi tiết tiến độ và hoạt động canh tác."}</p></div>
        <Badge variant="outline" className="border-[#D4E5DA] bg-white px-3 py-1 text-primary">{order?.status ?? "Đang trồng"}</Badge>
      </header>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card className="section-card"><CardContent className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#173B29]">{isOrder ? "Thông tin đơn hàng" : "Thông tin chu kỳ"}</h2>
          <dl className="mt-4 divide-y divide-[#EDF2EE]">{rows.map(([label, value]) => <div className="flex justify-between gap-4 py-3 text-sm" key={label}><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
        </CardContent></Card>
        <Card className="section-card"><CardContent className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#173B29]">{isOrder ? "Sản phẩm trong đơn" : "Tiến độ"}</h2>
          {order ? <>
            <div className="mt-4 space-y-3">{order.products.map((product) => <div key={product.name} className="rounded-xl border border-[#E1ECE4] bg-[#FBFDFC] p-4">
              <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF4EC] text-primary"><PackageCheck className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="font-semibold">{product.name}</h3><p className="mt-1 text-xs text-muted-foreground">Số lượng: {product.quantity} {product.unit} · Đơn giá: {money(product.unitPrice)} / {product.unit}</p><p className="mt-1 text-xs text-muted-foreground">Khối lượng quy cách: {product.weightGrams.toLocaleString("vi-VN")} g / {product.unit}</p></div></div>
              <div className="mt-3 flex justify-between border-t border-[#E1ECE4] pt-3 text-sm"><span className="text-muted-foreground">Tổng khối lượng</span><strong className="tabular-nums">{(product.quantity * product.weightGrams).toLocaleString("vi-VN")} g</strong></div>
              <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Thành tiền</span><strong className="tabular-nums">{money(product.quantity * product.unitPrice)}</strong></div>
            </div>)}</div>
            <div className="mt-5 flex justify-between border-t border-[#E1ECE4] pt-4"><span className="font-semibold">Tổng cộng</span><strong className="text-lg tabular-nums text-primary">{money(staffOrderTotal(order))}</strong></div>
          </> : <div className="mt-4"><div className="flex items-center justify-between text-xs"><span>Tiến độ sinh trưởng</span><strong>40%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[40%] rounded-full bg-primary" /></div><div className="mt-5 flex gap-3 rounded-xl bg-secondary/50 p-4"><Sprout className="size-5 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">Lịch sử môi trường ổn định. 2 công việc đang được phân công cho chu kỳ này.</p></div></div>}
          <Button className="mt-6 w-full" onClick={() => toast.success(isOrder ? "Đã xác nhận đơn." : "Đã xác nhận gieo hạt.")}><Check />{isOrder ? "Xác nhận đơn" : "Xác nhận gieo hạt"}</Button>
        </CardContent></Card>
      </div>
    </div>
  </main>;
}
