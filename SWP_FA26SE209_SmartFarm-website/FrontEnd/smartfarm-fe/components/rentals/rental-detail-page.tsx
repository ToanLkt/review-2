"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Sprout, Truck } from "lucide-react";

import {
  ApiError,
  canPayOrder,
  canScheduleOrderDelivery,
  getAuthErrorMessage,
  orderStatusLabel,
  orderStatusTone,
  orderTypeLabel,
  rentalService,
  type RentalOrder,
} from "@/lib/api";
import { cropStatusLabel, formatCustomerDateTime, formatVnd, parseBackendDate } from "@/lib/user-format";
import { Breadcrumb, StatusBadge } from "@/components/user/user-ui";
import { OrderPricingBreakdown } from "@/components/user/order-pricing-breakdown";

function dateTime(value: string | null | undefined) {
  return formatCustomerDateTime(value);
}

function harvestCountdown(value: string | null | undefined, referenceTime: number) {
  if (!value) return "Chưa có lịch thu hoạch";
  const harvest = new Date(value);
  if (Number.isNaN(harvest.getTime())) return "Chưa có lịch thu hoạch";
  const days = Math.ceil((harvest.getTime() - referenceTime) / 86_400_000);
  if (days < 0) return "Đã qua ngày thu hoạch dự kiến";
  if (days === 0) return "Dự kiến thu hoạch hôm nay";
  return `Còn ${days} ngày đến thu hoạch`;
}

export function RentalDetailPage({ id }: { id: number }) {
  const [renderedAt] = useState(() => Date.now());
  const [order, setOrder] = useState<RentalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void rentalService.getRental(id).then((result) => {
      if (active) setOrder(result);
    }).catch((requestError) => {
      if (!active) return;
      if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true);
      else setError(getAuthErrorMessage(requestError, "Không thể tải chi tiết đơn thuê."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-20 text-sm text-[#6b7280]">Đang tải chi tiết đơn thuê...</div>;
  if (notFound) return <div className="mx-auto max-w-5xl px-6 py-20"><h1 className="text-2xl font-bold">Không tìm thấy đơn thuê</h1><Link href="/rentals" className="mt-4 inline-block text-sm font-semibold text-[#4F8F68]">Quay lại danh sách</Link></div>;
  if (error || !order) return <div className="mx-auto max-w-5xl px-6 py-20"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-[#EF5350]">{error || "Dữ liệu đơn thuê không khả dụng."}</p></div>;

  const paymentDueAt = parseBackendDate(order.paymentDueAt)?.getTime() ?? Number.NaN;
  const payAllowed = canPayOrder(order.status)
    && order.isRiskAccepted
    && Number.isFinite(paymentDueAt)
    && paymentDueAt > renderedAt;
  const deliveryAllowed = canScheduleOrderDelivery(order.status);

  return <div className="mx-auto max-w-5xl px-6 py-10">
    <Breadcrumb items={[{ label: "Đơn thuê", href: "/rentals" }, { label: order.orderCode ?? `#${order.orderId}` }]} />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Chi tiết đơn thuê</h1><p className="mt-2 font-mono text-sm text-[#6b7280]">{order.orderCode ?? `#${order.orderId}`}</p></div><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</StatusBadge></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-[#e8f3eb] p-5"><p className="text-xs text-[#6b7280]">Loại đơn</p><p className="mt-2 font-semibold">{orderTypeLabel(order.orderType)}</p></div><div className="rounded-2xl border border-[#e8f3eb] p-5"><p className="text-xs text-[#6b7280]">Tổng tiền</p><p className="mt-2 font-bold text-[#4F8F68]">{formatVnd(order.totalAmount)}</p></div><div className="rounded-2xl border border-[#e8f3eb] p-5"><p className="text-xs text-[#6b7280]">Ngày tạo</p><p className="mt-2 text-sm font-semibold">{dateTime(order.createdAt)}</p></div><div className="rounded-2xl border border-[#e8f3eb] p-5"><p className="text-xs text-[#6b7280]">Hạn thanh toán</p><p className="mt-2 text-sm font-semibold">{dateTime(order.paymentDueAt)}</p></div></section>
    <section className="mt-6 grid gap-4 rounded-2xl border border-[#e8f3eb] bg-white p-6 sm:grid-cols-3"><div><p className="text-xs text-[#6b7280]">Ngày gieo dự kiến</p><p className="mt-1 text-sm font-semibold">{dateTime(order.targetPlantingDate)}</p></div><div><p className="text-xs text-[#6b7280]">Ngày nhận mong muốn</p><p className="mt-1 text-sm font-semibold">{dateTime(order.targetDeliveryDate)}</p></div><div><p className="text-xs text-[#6b7280]">Xác nhận rủi ro</p><p className={`mt-1 text-sm font-semibold ${order.isRiskAccepted ? "text-[#3F7655]" : "text-amber-700"}`}>{order.isRiskAccepted ? "Đã chấp nhận" : "Chưa xác nhận"}</p></div></section>
    <section className="mt-6 rounded-2xl border border-[#e8f3eb] bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-bold"><Sprout size={20} className="text-[#4F8F68]" />Khay trong đơn</h2>{!order.rentals?.length ? <p className="mt-5 rounded-xl bg-[#f3f8f4] p-5 text-sm text-[#6b7280]">SmartFarm sẽ sắp xếp khay sau khi xác nhận đơn thuê.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2">{order.rentals.map((rental) => <article key={rental.trayRentalId} className="rounded-xl bg-[#f3f8f4] p-5"><div className="flex items-center justify-between gap-3"><strong>{rental.trayCode ?? `Khay #${rental.soilTrayId}`}</strong><StatusBadge>{cropStatusLabel(rental.cropStatus)}</StatusBadge></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#6b7280]">Đợt trồng</dt><dd className="font-semibold">{rental.currentCycle}/{rental.totalCycles}</dd></div><div><dt className="text-xs text-[#6b7280]">Bắt đầu</dt><dd>{dateTime(rental.startDate)}</dd></div><div><dt className="text-xs text-[#6b7280]">Thu hoạch dự kiến</dt><dd>{dateTime(rental.expectedHarvestDate)}</dd>{!rental.actualHarvestDate && <dd className="mt-1 font-semibold text-[#4F8F68]">{harvestCountdown(rental.expectedHarvestDate, renderedAt)}</dd>}</div><div><dt className="text-xs text-[#6b7280]">Thu hoạch thực tế</dt><dd>{dateTime(rental.actualHarvestDate)}</dd></div></dl></article>)}</div>}</section>
    <OrderPricingBreakdown subtotal={order.subtotal} discountPercent={order.discountPercent} discountAmount={order.discountAmount} totalAmount={order.totalAmount} />
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3"><Link href="/rentals" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280]"><ArrowLeft size={16} />Quay lại danh sách</Link><div className="flex flex-wrap gap-3">{deliveryAllowed && <Link href={`/delivery?order=${order.orderId}`} className="inline-flex items-center gap-2 rounded-xl border border-[#4F8F68] px-5 py-3 text-sm font-semibold text-[#4F8F68]"><Truck size={16} />Đặt lịch giao</Link>}{payAllowed && <Link href={`/payment/${order.orderId}`} className="inline-flex items-center gap-2 rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white"><CreditCard size={16} />Thanh toán đơn thuê</Link>}</div></div>
  </div>;
}
