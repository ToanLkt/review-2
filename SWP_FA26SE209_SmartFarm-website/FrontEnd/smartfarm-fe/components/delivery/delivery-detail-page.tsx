"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, PackageCheck, Truck, UserRound } from "lucide-react";

import { ApiError, deliveryService, getAuthErrorMessage, type Delivery } from "@/lib/api";
import { Breadcrumb, StatusBadge } from "@/components/user/user-ui";
import { deliveryStatusLabel, displayValue, formatCustomerDateTime } from "@/lib/user-format";

function dateTime(value: string | null) {
  return formatCustomerDateTime(value);
}

export function DeliveryDetailPage({ id }: { id: number }) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void deliveryService.getDelivery(id)
      .then((result) => { if (active) setDelivery(result); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true);
        else setError(getAuthErrorMessage(requestError, "Không thể tải chi tiết giao hàng."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-20 text-sm text-[#6b7280]">Đang tải chi tiết giao hàng...</main>;
  if (notFound) return <main className="mx-auto max-w-5xl px-6 py-20"><h1 className="text-2xl font-bold">Không tìm thấy giao hàng</h1><Link href="/delivery" className="mt-4 inline-block text-sm font-semibold text-[#4F8F68]">Quay lại danh sách</Link></main>;
  if (error || !delivery) return <main className="mx-auto max-w-5xl px-6 py-20"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-[#EF5350]">{error || "Không thể tải thông tin giao hàng. Vui lòng thử lại."}</p></main>;

  return <main className="mx-auto max-w-5xl px-6 py-10"><Breadcrumb items={[{ label: "Giao hàng", href: "/delivery" }, { label: `#${delivery.deliveryId}` }]} /><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Chi tiết giao hàng</h1><p className="mt-2 font-mono text-sm text-[#6b7280]">{delivery.orderCode ?? `Đơn hàng #${delivery.orderId}`}</p></div><StatusBadge tone="blue">{deliveryStatusLabel(delivery.status)}</StatusBadge></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-[#e8f3eb] p-5"><PackageCheck size={19} className="text-[#4F8F68]" /><p className="mt-3 text-xs text-[#6b7280]">Mã giao hàng</p><p className="mt-1 font-semibold">{delivery.deliveryId}</p></div><div className="rounded-2xl border border-[#e8f3eb] p-5"><CalendarDays size={19} className="text-[#4F8F68]" /><p className="mt-3 text-xs text-[#6b7280]">Lịch giao</p><p className="mt-1 text-sm font-semibold">{dateTime(delivery.scheduledDeliveryAt)}</p></div><div className="rounded-2xl border border-[#e8f3eb] p-5"><Truck size={19} className="text-[#4F8F68]" /><p className="mt-3 text-xs text-[#6b7280]">Mã theo dõi</p><p className="mt-1 font-semibold">{displayValue(delivery.trackingCode)}</p></div><div className="rounded-2xl border border-[#e8f3eb] p-5"><Truck size={19} className="text-[#4F8F68]" /><p className="mt-3 text-xs text-[#6b7280]">Khối lượng thực tế</p><p className="mt-1 font-semibold">{delivery.actualWeightKg === null ? "Chưa cập nhật" : `${delivery.actualWeightKg} kg`}</p></div></section>
    <div className="mt-6 grid gap-6 md:grid-cols-2"><section className="rounded-2xl border border-[#e8f3eb] bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-bold"><UserRound size={20} className="text-[#4F8F68]" />Người nhận</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-[#6b7280]">Họ tên</dt><dd className="mt-1 font-semibold">{displayValue(delivery.recipientName)}</dd></div><div><dt className="text-[#6b7280]">Điện thoại</dt><dd className="mt-1 font-semibold">{displayValue(delivery.recipientPhone)}</dd></div><div><dt className="text-[#6b7280]">Địa chỉ</dt><dd className="mt-1 flex gap-2 font-semibold"><MapPin size={16} className="mt-0.5 shrink-0 text-[#4F8F68]" />{displayValue(delivery.shippingAddress)}</dd></div></dl></section><section className="rounded-2xl border border-[#e8f3eb] bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-bold"><Truck size={20} className="text-[#4F8F68]" />Vận chuyển</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-[#6b7280]">Người giao</dt><dd className="mt-1 font-semibold">{displayValue(delivery.shipperName)}</dd></div><div><dt className="text-[#6b7280]">Đã gửi lúc</dt><dd className="mt-1 font-semibold">{dateTime(delivery.shippedAt)}</dd></div><div><dt className="text-[#6b7280]">Đã giao lúc</dt><dd className="mt-1 font-semibold">{dateTime(delivery.deliveredAt)}</dd></div><div><dt className="text-[#6b7280]">Ghi chú</dt><dd className="mt-1 font-semibold">{displayValue(delivery.notes)}</dd></div></dl></section></div>
    <Link href="/delivery" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280]"><ArrowLeft size={16} />Quay lại danh sách</Link></main>;
}
