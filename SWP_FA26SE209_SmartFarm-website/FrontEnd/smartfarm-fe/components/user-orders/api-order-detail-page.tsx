"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, CreditCard, Leaf,
  MapPin, PackageCheck, RotateCcw, Sprout, Star, Truck, XCircle,
} from "lucide-react";

import {
  ApiError, canPayOrder, canRetryPayment, canScheduleOrderDelivery, deliveryService, getAuthErrorMessage,
  normalizePaymentStatus, orderService, orderStatusLabel, orderStatusTone, orderTypeLabel,
  paymentExceptionLabel, paymentService, publicFarmService, type Delivery, type OrderDetails, type PaymentStatusResponse,
} from "@/lib/api";
import { cropStatusLabel, displayValue, formatCustomerDate, formatCustomerDateTime, formatVnd, orderItemTypeLabel, parseBackendDate } from "@/lib/user-format";
import { Breadcrumb, StatusBadge } from "@/components/user/user-ui";

const surfaceClass = "rounded-[1.75rem] bg-[#e6eee7] p-1.5 ring-1 ring-[#d9e6db]";
const surfaceCoreClass = "rounded-[1.4rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_45px_rgba(31,68,47,0.06)]";

function harvestCountdown(value: string | null | undefined, referenceTime: number) {
  if (!value) return null;
  const harvest = parseBackendDate(value);
  if (!harvest) return null;
  const days = Math.ceil((harvest.getTime() - referenceTime) / 86_400_000);
  if (days < 0) return "Đã qua ngày dự kiến";
  if (days === 0) return "Dự kiến thu hoạch hôm nay";
  return `Còn ${days} ngày`;
}

function deliveryStatusLabel(status: Delivery["status"]) {
  if (status === "PENDING") return "Chờ chuẩn bị";
  if (status === "PACKAGED") return "Đã đóng gói";
  if (status === "SHIPPING") return "Đang giao";
  if (status === "DELIVERED") return "Đã giao";
  if (status === "FAILED") return "Giao không thành công";
  return "Đang cập nhật";
}

function paymentStatusMeta(payment: PaymentStatusResponse | null, order: OrderDetails) {
  const status = normalizePaymentStatus(payment?.status);
  if (order.status === "EXPIRED") return { label: "Đơn hàng đã hết hạn", note: "Không chuyển khoản cho đơn hàng này.", tone: "muted" as const, icon: Clock3 };
  if (status === "SUCCESS") return { label: "Đã thanh toán", note: payment?.paidAt ? `Xác nhận lúc ${formatCustomerDateTime(payment.paidAt)}` : "Giao dịch đã được xác nhận.", tone: "success" as const, icon: CheckCircle2 };
  if (status === "FAILED") return { label: "Thanh toán chưa thành công", note: paymentExceptionLabel(payment?.exceptionType) ?? "Giao dịch chưa được xác nhận.", tone: "danger" as const, icon: XCircle };
  if (status === "EXPIRED") return { label: "Thanh toán đã hết hạn", note: "Không chuyển khoản theo hướng dẫn cũ.", tone: "muted" as const, icon: Clock3 };
  if (status === "PENDING") return { label: "Chờ thanh toán", note: "Hệ thống đang chờ xác nhận chuyển khoản.", tone: "warning" as const, icon: Clock3 };
  if (order.status === "AWAITING_PAYMENT") return { label: "Chưa tạo thanh toán", note: "Mở hướng dẫn thanh toán khi bạn đã sẵn sàng.", tone: "warning" as const, icon: CreditCard };
  return { label: "Chưa có dữ liệu thanh toán", note: "Thông tin thanh toán chưa được ghi nhận cho đơn này.", tone: "muted" as const, icon: CreditCard };
}

function rentalStatusForCustomer(orderStatus: OrderDetails["status"], cropStatus: string | null | undefined) {
  if (orderStatus === "AWAITING_PAYMENT") return "Chờ xác nhận thanh toán";
  if (orderStatus === "EXPIRED") return "Đơn đã hết hạn";
  return cropStatusLabel(cropStatus);
}

function DetailSkeleton() {
  return <main className="min-h-[70dvh] bg-[#f5f7f3] px-4 py-8 sm:px-6 lg:py-12">
    <div className="mx-auto max-w-[1380px] animate-pulse">
      <div className="h-5 w-36 rounded-full bg-[#dfe8df]" />
      <div className="mt-8 h-32 rounded-[1.75rem] bg-[#e6eee7]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.95fr)]"><div className="h-[560px] rounded-[1.75rem] bg-[#e6eee7]" /><div className="h-[470px] rounded-[1.75rem] bg-[#dce8de]" /></div>
    </div>
  </main>;
}

export function ApiOrderDetailPage({ id }: { id: number }) {
  const [renderedAt] = useState(() => Date.now());
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await orderService.getOrder(id);
        if (!active) return;
        setOrder(result);
        setDeliveryLoading(true);
        const [paymentResult, deliveryResult] = await Promise.allSettled([
          paymentService.getPaymentStatus(id),
          deliveryService.getDeliveries({ search: result.orderCode ?? undefined, page: 1, pageSize: 50 }),
        ]);
        if (!active) return;
        if (paymentResult.status === "fulfilled") setPayment(paymentResult.value);
        else if (!(paymentResult.reason instanceof ApiError && paymentResult.reason.status === 404)) setPaymentError(getAuthErrorMessage(paymentResult.reason, "Không thể tải trạng thái thanh toán."));
        if (deliveryResult.status === "fulfilled") setDeliveries(deliveryResult.value.items.filter((item) => item.orderId === id));
        else setDeliveryError(getAuthErrorMessage(deliveryResult.reason, "Không thể tải thông tin giao hàng."));
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true);
        else setError(getAuthErrorMessage(requestError, "Không thể tải chi tiết đơn hàng."));
      } finally {
        if (active) { setLoading(false); setDeliveryLoading(false); }
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  const itemSubtotal = useMemo(() => order?.items?.reduce((sum, item) => sum + item.subtotal, 0) ?? 0, [order]);

  if (loading) return <DetailSkeleton />;
  if (notFound) return <main className="min-h-[70dvh] bg-[#f5f7f3] px-4 py-20"><div className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-8 text-center"><PackageCheck className="mx-auto text-[#6f9279]" size={34} /><h1 className="mt-5 text-2xl font-bold text-[#173c2b]">Không tìm thấy đơn hàng</h1><p className="mt-2 text-sm text-[#68766d]">Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.</p><Link href="/orders" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#356b4b]"><ArrowLeft size={16} />Quay lại đơn hàng</Link></div></main>;
  if (error || !order) return <main className="min-h-[70dvh] bg-[#f5f7f3] px-4 py-20"><div className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-8"><h1 className="text-2xl font-bold text-[#173c2b]">Chưa thể mở đơn hàng</h1><p role="alert" className="mt-4 rounded-2xl bg-[#fff0ed] p-4 text-sm text-[#a64539]">{error || "Dữ liệu đơn hàng không khả dụng."}</p><Link href="/orders" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#356b4b]"><ArrowLeft size={16} />Quay lại đơn hàng</Link></div></main>;

  const paymentMeta = paymentStatusMeta(payment, order);
  const PaymentIcon = paymentMeta.icon;
  const normalizedPayment = normalizePaymentStatus(payment?.status);
  const dueAt = parseBackendDate(order.paymentDueAt)?.getTime() ?? Number.NaN;
  const paymentStillValid = Number.isFinite(dueAt) && dueAt > renderedAt;
  const riskAllowsPayment = order.orderType !== "TRAY_RENTAL" || order.isRiskAccepted;
  const paymentRetryAllowed = canRetryPayment(payment?.status, payment?.exceptionType, order.status, order.paymentDueAt, renderedAt);
  const paymentBlocksPayment = normalizedPayment === "SUCCESS"
    || normalizedPayment === "EXPIRED"
    || (normalizedPayment === "FAILED" && !paymentRetryAllowed);
  const payAllowed = canPayOrder(order.status) && riskAllowsPayment && paymentStillValid && !paymentBlocksPayment;
  const deliveryAllowed = canScheduleOrderDelivery(order.status);
  const usesItemSubtotalFallback = order.orderType === "SEED_PACKET" && order.subtotal === 0 && itemSubtotal > 0;
  const displaySubtotal = usesItemSubtotalFallback ? itemSubtotal : order.subtotal;
  const pricingIncomplete = Math.abs(displaySubtotal - order.discountAmount - order.totalAmount) >= 1;
  const paymentToneClass = paymentMeta.tone === "success" ? "bg-[#e4f1e7] text-[#2f6947]" : paymentMeta.tone === "danger" ? "bg-[#fff0ed] text-[#a64539]" : paymentMeta.tone === "warning" ? "bg-[#fff6d9] text-[#82661d]" : "bg-[#edf0ed] text-[#5f6d63]";

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewing(true);
    setReviewMessage("");
    try {
      await publicFarmService.createReview(id, { rating, comment: comment.trim() || null });
      setReviewSent(true);
      setReviewMessage("Cảm ơn bạn đã chia sẻ trải nghiệm với SmartFarm.");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) setReviewMessage("Đơn hàng chưa đủ điều kiện đánh giá hoặc đã được đánh giá.");
      else setReviewMessage(getAuthErrorMessage(requestError, "Không thể gửi đánh giá."));
    } finally { setReviewing(false); }
  }

  return <main className="min-h-[100dvh] bg-[#f5f7f3] px-4 py-7 text-[#173c2b] sm:px-6 lg:py-10">
    <div className="mx-auto max-w-[1380px]">
      <Breadcrumb items={[{ label: "Đơn hàng", href: "/orders" }, { label: "Chi tiết" }]} />
      <header className={`${surfaceClass} mt-5`}><div className={`${surfaceCoreClass} px-5 py-6 sm:px-7 lg:px-9 lg:py-8`}><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-[#65806c]">{orderTypeLabel(order.orderType)}</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.035em] text-[#173c2b] sm:text-4xl">Chi tiết đơn hàng</h1><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#68766d]"><span className="font-mono font-semibold text-[#315c42]">{order.orderCode ?? `#${order.orderId}`}</span><span>Đặt lúc {formatCustomerDateTime(order.createdAt)}</span></div></div><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</StatusBadge></div></div></header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(330px,0.95fr)] xl:gap-8">
        <div className="min-w-0 space-y-6">
          <section className={surfaceClass}><div className={`${surfaceCoreClass} overflow-hidden`}><div className="px-5 pb-3 pt-6 sm:px-7 sm:pt-7"><h2 className="text-xl font-bold tracking-[-0.02em]">Sản phẩm đã chọn</h2><p className="mt-1 text-sm text-[#758079]">Kiểm tra số lượng, số chu kỳ và thành tiền của từng sản phẩm.</p></div>
            {!order.items?.length ? <p className="m-5 rounded-2xl bg-[#f1f5f0] p-5 text-sm text-[#68766d] sm:m-7">Đơn hàng chưa có thông tin sản phẩm.</p> : <div className="divide-y divide-[#e5ece5] px-5 sm:px-7">{order.items.map((item) => <article key={item.orderItemId} className="flex gap-4 py-5 sm:items-center sm:gap-5"><div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-[#e7efe6] text-[#477458] sm:size-24">{order.orderType === "TRAY_RENTAL" ? <Sprout size={32} strokeWidth={1.6} /> : <Leaf size={32} strokeWidth={1.6} />}</div><div className="min-w-0 flex-1"><p className="text-base font-bold text-[#173c2b]">{item.supplyName ?? `Sản phẩm #${item.supplyId}`}</p><p className="mt-1 text-sm text-[#758079]">{orderItemTypeLabel(item.itemType)}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span>{item.quantity} {order.orderType === "TRAY_RENTAL" ? "khay" : "gói"}</span>{order.orderType === "TRAY_RENTAL" && <span>{item.totalCycles} chu kỳ</span>}</div></div><div className="shrink-0 text-right"><p className="text-xs text-[#758079]">{order.orderType === "TRAY_RENTAL" ? `${formatVnd(item.unitPrice)} / chu kỳ` : "Thành tiền"}</p><p className="mt-1 font-bold tabular-nums text-[#244f37]">{formatVnd(item.subtotal)}</p></div></article>)}</div>}
          </div></section>

          {order.orderType === "TRAY_RENTAL" && <section className={surfaceClass}><div className={`${surfaceCoreClass} px-5 py-6 sm:px-7 sm:py-7`}><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold tracking-[-0.02em]">Thông tin trồng rau</h2><p className="mt-1 text-sm text-[#758079]">Lịch gieo, chu kỳ và tiến độ của từng khay.</p></div>{order.targetPlantingDate && <span className="text-sm font-semibold text-[#4b6f57]">Ngày gieo dự kiến: {formatCustomerDate(order.targetPlantingDate)}</span>}</div>
            {order.status === "AWAITING_PAYMENT" && <div className="mt-5 rounded-2xl bg-[#fff6d9] px-4 py-3 text-sm leading-6 text-[#725c20]">Khay sẽ bắt đầu được chuẩn bị sau khi thanh toán được xác nhận.</div>}
            {!order.rentals?.length ? <p className="mt-5 rounded-2xl bg-[#f1f5f0] p-5 text-sm text-[#68766d]">SmartFarm chưa phân bổ khay cho đơn hàng này.</p> : <div className="mt-5 grid gap-3">{order.rentals.map((rental) => <article key={rental.trayRentalId} className="grid gap-4 rounded-2xl bg-[#f1f5f0] p-4 sm:grid-cols-[minmax(150px,1.15fr)_repeat(3,minmax(110px,1fr))] sm:items-center sm:p-5"><div><p className="font-bold">{rental.trayCode ?? `Khay #${rental.soilTrayId}`}</p><p className="mt-1 text-xs font-semibold text-[#5d8068]">{rentalStatusForCustomer(order.status, rental.cropStatus)}</p></div><div><p className="text-xs text-[#7c8780]">Chu kỳ</p><p className="mt-1 text-sm font-semibold">{rental.currentCycle}/{rental.totalCycles}</p></div><div><p className="text-xs text-[#7c8780]">Ngày gieo</p><p className="mt-1 text-sm font-semibold">{formatCustomerDate(rental.startDate)}</p></div><div><p className="text-xs text-[#7c8780]">Thu hoạch dự kiến</p><p className="mt-1 text-sm font-semibold">{formatCustomerDate(rental.expectedHarvestDate)}</p>{order.status !== "AWAITING_PAYMENT" && !rental.actualHarvestDate && <p className="mt-1 text-xs text-[#5d8068]">{harvestCountdown(rental.expectedHarvestDate, renderedAt)}</p>}</div></article>)}</div>}
            <div className="mt-5 grid gap-3 border-t border-[#e5ece5] pt-5 sm:grid-cols-2"><div className="flex gap-3"><CalendarDays className="mt-0.5 shrink-0 text-[#62806b]" size={18} /><div><p className="text-xs text-[#7c8780]">Ngày nhận mong muốn</p><p className="mt-1 text-sm font-semibold">{formatCustomerDate(order.targetDeliveryDate)}</p></div></div><div className="flex gap-3"><RotateCcw className="mt-0.5 shrink-0 text-[#62806b]" size={18} /><div><p className="text-xs text-[#7c8780]">Xác nhận rủi ro</p><p className="mt-1 text-sm font-semibold">{order.isRiskAccepted ? "Đã xác nhận" : "Chưa xác nhận"}</p></div></div></div>
          </div></section>}

          <section className={surfaceClass}><div className={`${surfaceCoreClass} px-5 py-6 sm:px-7 sm:py-7`}><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold tracking-[-0.02em]">Giao hàng</h2><p className="mt-1 text-sm text-[#758079]">Thông tin được lấy từ địa chỉ của đơn và từng lịch giao.</p></div>{deliveryAllowed && deliveries.length > 0 && <Link href={`/delivery?order=${order.orderId}`} className="inline-flex items-center gap-2 rounded-full bg-[#e6efe7] px-4 py-2 text-sm font-semibold text-[#315f43] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#d9e8dc] active:scale-[0.98]"><Truck size={16} />Quản lý lịch giao</Link>}</div>
            {order.shippingAddress && <div className="mt-5 grid gap-3 rounded-2xl bg-[#f1f5f0] p-4 text-sm sm:grid-cols-2"><div className="flex gap-3 sm:col-span-2"><MapPin className="mt-0.5 shrink-0 text-[#557461]" size={18} /><div><p className="text-xs text-[#7c8780]">Địa chỉ trên đơn hàng</p><p className="mt-1 font-semibold text-[#315c42]">{displayValue(order.shippingAddress)}</p>{typeof order.shippingLatitude === "number" && typeof order.shippingLongitude === "number" && <p className="mt-1 text-xs tabular-nums text-[#7c8780]">{order.shippingLatitude.toFixed(6)}, {order.shippingLongitude.toFixed(6)}</p>}</div></div><div><p className="text-xs text-[#7c8780]">Khoảng cách giao hàng</p><p className="mt-1 font-semibold">{typeof order.deliveryDistanceKm !== "number" ? "Chưa xác định" : `${order.deliveryDistanceKm.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} km`}</p></div><div><p className="text-xs text-[#7c8780]">Xác nhận ngoài bán kính</p><p className={`mt-1 font-semibold ${order.isAccepted ? "text-amber-700" : "text-[#356b4b]"}`}>{order.isAccepted ? "Đã chấp nhận" : "Không yêu cầu"}</p></div></div>}
            {deliveryLoading ? <div className="mt-5 h-20 animate-pulse rounded-2xl bg-[#edf2ec]" /> : deliveryError ? <p role="alert" className="mt-5 rounded-2xl bg-[#fff0ed] p-4 text-sm text-[#a64539]">{deliveryError}</p> : deliveries.length === 0 ? <div className="mt-5 flex gap-3 rounded-2xl bg-[#f1f5f0] p-5"><MapPin className="shrink-0 text-[#67816e]" size={19} /><div><p className="text-sm font-semibold">Hệ thống chưa có lịch giao</p><p className="mt-1 text-sm text-[#758079]">Khi có địa chỉ phù hợp, hệ thống sẽ lên lịch giao hàng cho bạn.</p></div></div> : <div className="mt-5 space-y-3">{deliveries.map((delivery) => <article key={delivery.deliveryId} className="rounded-2xl bg-[#f1f5f0] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div className="flex gap-3"><Truck className="mt-0.5 shrink-0 text-[#557461]" size={18} /><div><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-bold">{deliveryStatusLabel(delivery.status)}</p>{order.orderType === "TRAY_RENTAL" && <span className="text-xs font-semibold text-[#66806e]">Đợt {delivery.cycleNumber}</span>}</div><p className="mt-2 text-xs text-[#7c8780]">Lịch giao đã đặt</p><p className="mt-0.5 text-sm font-semibold text-[#68766d]">{formatCustomerDateTime(delivery.scheduledDeliveryAt)}</p>{delivery.deliveredAt && <><p className="mt-2 text-xs text-[#7c8780]">Giao thực tế</p><p className="mt-0.5 text-sm font-semibold text-[#68766d]">{formatCustomerDateTime(delivery.deliveredAt)}</p></>}<p className="mt-2 text-sm text-[#68766d]">{displayValue(delivery.shippingAddress)}</p>{delivery.trackingCode && <p className="mt-1 font-mono text-xs text-[#557461]">Mã theo dõi: {delivery.trackingCode}</p>}</div></div><div className="mt-4 flex flex-wrap gap-3 sm:mt-0 sm:flex-col sm:items-end"><Link href={`/delivery/${delivery.deliveryId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#356b4b]">Xem chi tiết <ArrowRight size={14} /></Link>{deliveryAllowed && delivery.status !== "SHIPPING" && delivery.status !== "DELIVERED" && <Link href={`/delivery?order=${order.orderId}&delivery=${delivery.deliveryId}`} className="text-sm font-semibold text-[#315f43]">Đặt lịch chu kỳ {delivery.cycleNumber}</Link>}</div></article>)}</div>}
          </div></section>

          {order.status === "COMPLETED" && <section className={surfaceClass}>
            <div className={`${surfaceCoreClass} px-5 py-6 sm:px-7 sm:py-7`}>
              <h2 className="text-xl font-bold">Đánh giá trải nghiệm</h2>
              {reviewSent ? <p role="status" className="mt-4 rounded-2xl bg-[#e5f1e7] p-4 text-sm text-[#356b4b]">{reviewMessage}</p> : <form onSubmit={submitReview} className="mt-5">
                <fieldset>
                  <legend className="text-sm font-semibold">Mức độ hài lòng</legend>
                  <div className="mt-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} sao`} className="rounded-lg p-1 text-[#d49b35] transition-transform active:scale-95">
                        <Star size={24} fill={value <= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="mt-5 block text-sm font-semibold">Chia sẻ thêm <span className="font-normal text-[#8b958e]">(không bắt buộc)</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full rounded-2xl bg-[#f1f5f0] px-4 py-3 text-sm outline-none ring-1 ring-[#dce7dd] focus:ring-2 focus:ring-[#5f8a6d]" /></label>
                {reviewMessage && <p role="alert" className="mt-3 rounded-2xl bg-[#fff6d9] p-3 text-sm text-[#725c20]">{reviewMessage}</p>}
                <button disabled={reviewing} className="mt-4 rounded-full bg-[#214f36] px-5 py-3 text-sm font-semibold text-white transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#173c2b] active:scale-[0.98] disabled:opacity-50">{reviewing ? "Đang gửi..." : "Gửi đánh giá"}</button>
              </form>}
            </div>
          </section>}
        </div>

        <aside className={`${surfaceClass} lg:sticky lg:top-24`}><div className={`${surfaceCoreClass} overflow-hidden`}><div className="bg-[#214f36] px-5 py-6 text-white sm:px-7"><p className="text-sm font-medium text-[#c8ddce]">Tổng thanh toán</p><p className="mt-2 text-4xl font-bold tracking-[-0.04em] tabular-nums">{formatVnd(order.totalAmount)}</p><p className="mt-3 text-xs text-[#c8ddce]">Hạn thanh toán: {formatCustomerDateTime(order.paymentDueAt)}</p></div><div className="px-5 py-6 sm:px-7"><h2 className="text-lg font-bold">Chi tiết thanh toán</h2><dl className="mt-5 space-y-3.5 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#68766d]">{order.orderType === "TRAY_RENTAL" ? "Tạm tính tiền thuê" : "Tạm tính tiền hàng"}</dt><dd className="font-semibold tabular-nums">{formatVnd(displaySubtotal)}</dd></div>{order.discountAmount > 0 && <div className="flex justify-between gap-4 text-[#356b4b]"><dt>Giảm giá ({order.discountPercent.toLocaleString("vi-VN")}%)</dt><dd className="font-semibold tabular-nums">-{formatVnd(order.discountAmount)}</dd></div>}<div className="flex justify-between gap-4 border-t border-[#e1e9e2] pt-3"><dt className="font-bold">Tổng cộng</dt><dd className="font-bold tabular-nums text-[#214f36]">{formatVnd(order.totalAmount)}</dd></div></dl>
          {usesItemSubtotalFallback && <p className="mt-4 rounded-2xl bg-[#fff6d9] p-3 text-xs leading-5 text-[#725c20]">Tạm tính được tổng hợp từ các sản phẩm vì đơn hàng chưa trả về giá trị tạm tính.</p>}
          {pricingIncomplete && <p className="mt-4 rounded-2xl bg-[#fff6d9] p-3 text-xs leading-5 text-[#725c20]">Chi tiết giá của đơn hàng cũ không còn đầy đủ. Tổng thanh toán phía trên vẫn là số tiền chính thức của đơn.</p>}
          <div className="my-6 h-px bg-[#e1e9e2]" /><div className={`rounded-2xl p-4 ${paymentToneClass}`}><div className="flex gap-3"><PaymentIcon className="mt-0.5 shrink-0" size={19} /><div><p className="text-sm font-bold">{paymentMeta.label}</p><p className="mt-1 text-xs leading-5 opacity-90">{paymentMeta.note}</p></div></div></div>{paymentError && <p role="alert" className="mt-3 text-xs leading-5 text-[#a64539]">{paymentError}</p>}{!riskAllowsPayment && <p className="mt-3 text-xs leading-5 text-[#82661d]">Bạn cần xác nhận điều khoản rủi ro của đơn thuê trước khi thanh toán.</p>}
          {payAllowed && <Link href={`/payment/${order.orderId}`} className="group mt-5 flex min-h-12 w-full items-center justify-between rounded-full bg-[#214f36] py-2 pl-5 pr-2 text-sm font-bold text-white transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#173c2b] active:scale-[0.98]"><span>{paymentRetryAllowed ? "Thanh toán lại" : "Thanh toán ngay"}</span><span className="grid size-9 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"><ArrowRight size={17} /></span></Link>}
          <Link href="/orders" className="mt-4 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-[#5c6d61] transition-colors hover:text-[#214f36]"><ArrowLeft size={15} />Quay lại danh sách</Link>
        </div></div></aside>
      </div>
    </div>
  </main>;
}
