"use client";

import { DetailSkeleton } from "@/components/ui/loading-state";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, PackageCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { date, money, stamp } from "@/lib/formatters";
import {
  STAFF_ORDER_STATUSES,
  type StaffOrder,
  type StaffOrderStatus,
} from "@/lib/api/staff/staff-orders-service";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import {
  nextOrderStatus,
  orderStatusClass,
  orderStatusLabel,
  orderTypeLabel,
} from "./staff-order-display";

export function StaffOrderDetail({ id, basePath = "/staff/orders" }: { id: string; basePath?: string }) {
  const orderId = Number(id);
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const validOrderId = Number.isInteger(orderId) && orderId > 0;

  useEffect(() => {
    if (!validOrderId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    staffOrdersService.get(orderId)
      .then((data) => { if (!cancelled) setOrder(data); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải chi tiết đơn hàng.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, reloadKey, validOrderId]);

  const currentStatus = STAFF_ORDER_STATUSES.includes(order?.status as StaffOrderStatus)
    ? order?.status as StaffOrderStatus
    : undefined;
  const nextStatus = currentStatus ? nextOrderStatus[currentStatus] : undefined;

  const transition = async () => {
    if (!order || !nextStatus) return;
    setUpdating(true);
    try {
      const updated = await staffOrdersService.updateStatus(order.orderId, nextStatus);
      setOrder(updated);
      toast.success(`Đã chuyển đơn sang “${orderStatusLabel(updated.status)}”.`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật trạng thái đơn.");
    } finally {
      setUpdating(false);
    }
  };

  if (!validOrderId) return <StatePage text="Mã đơn hàng không hợp lệ." basePath={basePath} />;
  if (loading) return <DetailSkeleton />;
  if (error || !order) return <StatePage text={error || "Không tìm thấy đơn hàng."} basePath={basePath} retry={() => setReloadKey((value) => value + 1)} />;

  const rows = [
    ["Mã đơn", order.orderCode],
    ["Khách hàng", order.customerName || "Khách hàng"],
    ["Loại đơn", orderTypeLabel(order.orderType)],
    ["Địa chỉ giao", order.shippingAddress || "Không áp dụng"],
    ["Ngày tạo", stamp(order.createdAt)],
    ["Hạn thanh toán", stamp(order.paymentDueAt)],
  ];

  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]">
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 -ml-3"><Link href={basePath}><ArrowLeft />Quay lại danh sách</Link></Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kinh doanh / Đơn hàng</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Đơn hàng {order.orderCode}</h1><p className="mt-2 text-sm text-muted-foreground">Thông tin khách hàng, sản phẩm và tiến độ xử lý đơn hàng.</p></div>
        <Badge variant="outline" className={orderStatusClass(order.status)}>{orderStatusLabel(order.status)}</Badge>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="section-card"><CardContent className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#173B29]">Thông tin đơn hàng</h2>
          <dl className="mt-4 divide-y divide-[#EDF2EE]">{rows.map(([label, value]) => <div className="flex justify-between gap-4 py-3 text-sm" key={label}><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
          <div className="mt-5 rounded-xl bg-[#F5FAF6] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#55715F]">Luồng trạng thái</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">Chờ thanh toán → Đã xác nhận → Đang chuẩn bị → Đang giao → Hoàn tất</p>
          </div>
        </CardContent></Card>

        <Card className="section-card"><CardContent className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#173B29]">{order.orderType === "TRAY_RENTAL" ? "Khay thuê" : "Sản phẩm trong đơn"}</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => <div key={item.orderItemId} className="rounded-xl border border-[#E1ECE4] bg-[#FBFDFC] p-4">
              <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF4EC] text-primary"><PackageCheck className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="font-semibold">{item.supplyName}</h3><p className="mt-1 text-xs text-muted-foreground">Số lượng: {item.quantity} · Đơn giá: {money(item.unitPrice)}</p></div></div>
              <div className="mt-3 flex justify-between border-t border-[#E1ECE4] pt-3 text-sm"><span className="text-muted-foreground">Thành tiền</span><strong className="tabular-nums">{money(item.subtotal)}</strong></div>
            </div>)}
            {order.rentals.map((rental) => <div key={rental.trayRentalId} className="rounded-xl border border-[#E1ECE4] bg-[#FBFDFC] p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">Khay {rental.trayCode}</h3><p className="mt-1 text-xs text-muted-foreground">Bắt đầu: {date(rental.startDate)} · Thu hoạch dự kiến: {date(rental.expectedHarvestDate)}</p></div><Badge variant="outline">{rental.cropStatus}</Badge></div>
            </div>)}
            {!order.items.length && !order.rentals.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Đơn chưa có dòng sản phẩm hoặc khay thuê.</p>}
          </div>
          <div className="mt-5 flex justify-between border-t border-[#E1ECE4] pt-4"><span className="font-semibold">Tổng cộng</span><strong className="text-lg tabular-nums text-primary">{money(order.totalAmount)}</strong></div>
          {nextStatus ? <Button className="mt-6 w-full" onClick={transition} disabled={updating}><Check />{updating ? "Đang cập nhật..." : `Chuyển sang “${orderStatusLabel(nextStatus)}”`}</Button>
          : <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">Đơn ở trạng thái kết thúc, không còn bước chuyển tiếp.</p>}
        </CardContent></Card>
      </div>
    </div>
  </main>;
}

function StatePage({ text, retry, basePath }: { text: string; retry?: () => void; basePath: string }) {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] px-4 py-12 text-center"><PackageCheck className="mx-auto size-10 text-[#8BAF9A]" /><h1 className="mt-4 text-xl font-bold">{text}</h1><div className="mt-5 flex justify-center gap-2">{retry && <Button variant="outline" onClick={retry}><RefreshCw />Thử lại</Button>}<Button asChild variant="outline"><Link href={basePath}>Quay lại danh sách</Link></Button></div></main>;
}
