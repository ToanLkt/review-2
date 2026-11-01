"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, MapPin, Search, Truck } from "lucide-react";

import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { DeliveryAddressPicker } from "@/components/delivery/delivery-address-picker";
import { PageHeader, StatusBadge } from "@/components/user/user-ui";
import {
  canScheduleOrderDelivery,
  deliveryService,
  getAuthErrorMessage,
  getDeliveryAcceptanceError,
  orderService,
  type Delivery,
  type DeliveryPreview,
  type OrderDetails,
} from "@/lib/api";
import type { DeliveryAddressValue } from "@/lib/delivery-address";
import {
  deliveryStatusLabel,
  displayValue,
  formatCustomerDate,
  formatCustomerDateTime,
  parseBackendDate,
  toCustomerDateTimeInput,
} from "@/lib/user-format";

const pageSize = 8;
const fieldClass = "mt-2 h-12 w-full rounded-xl border border-[#dce9df] bg-[#f8fbf9] px-4 text-sm outline-none focus:border-[#4F8F68] disabled:cursor-not-allowed disabled:bg-[#eef2ef]";
const emptyAddress: DeliveryAddressValue = { address: "", latitude: null, longitude: null };

function statusTone(status: string | null): "green" | "amber" | "red" | "blue" {
  const value = status?.trim().toLowerCase() ?? "";
  if (value.includes("deliver")) return "green";
  if (value.includes("cancel") || value.includes("fail")) return "red";
  if (value.includes("pending") || value.includes("schedule")) return "amber";
  return "blue";
}

function verifiedDeliveryWindow(order: OrderDetails | null, delivery: Delivery | null) {
  if (!order || !delivery || order.orderType !== "TRAY_RENTAL") return null;
  if (!delivery.rentalId) return { reason: "Delivery này chưa gắn với khay thuê cụ thể nên chưa thể xác minh cửa sổ thu hoạch." } as const;
  const rental = order.rentals?.find((item) => item.trayRentalId === delivery.rentalId);
  if (!rental) return { reason: "Không tìm thấy khay thuê tương ứng với Delivery này." } as const;
  if (rental.currentCycle !== delivery.cycleNumber) {
    return { reason: `Backend chưa trả đủ ngày thu hoạch để xác minh chính xác chu kỳ ${delivery.cycleNumber}.` } as const;
  }
  const harvest = parseBackendDate(rental.actualHarvestDate ?? rental.expectedHarvestDate);
  if (!harvest) return { reason: "Chưa có ngày thu hoạch hợp lệ cho chu kỳ này." } as const;
  return { from: harvest, to: new Date(harvest.getTime() + 2 * 86_400_000), reason: null } as const;
}

export function DeliveryPage() {
  const { user } = useCustomerAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orderDeliveries, setOrderDeliveries] = useState<Delivery[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [requestedDeliveryId, setRequestedDeliveryId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressValue>(emptyAddress);
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [scheduledDeliveryAt, setScheduledDeliveryAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [success, setSuccess] = useState("");
  const [renderedAt] = useState(() => Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = Number(params.get("order"));
    const deliveryId = Number(params.get("delivery"));
    queueMicrotask(() => {
      if (Number.isInteger(deliveryId) && deliveryId > 0) setRequestedDeliveryId(deliveryId);
      if (Number.isInteger(orderId) && orderId > 0) {
        setOrderLoading(true);
        setSelectedOrderId(orderId);
      }
    });
  }, []);

  useEffect(() => {
    let active = true;
    void deliveryService.getDeliveries({ search, page, pageSize })
      .then((result) => {
        if (!active) return;
        setDeliveries(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .catch((requestError) => {
        if (active) setListError(getAuthErrorMessage(requestError, "Không thể tải danh sách giao hàng."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, refreshVersion, search]);

  useEffect(() => {
    if (!selectedOrderId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setOrderLoading(true);
      setOrderError("");
    });
    void orderService.getOrder(selectedOrderId)
      .then(async (order) => {
        const result = await deliveryService.getDeliveries({ search: order.orderCode ?? undefined, page: 1, pageSize: 100 });
        if (!active) return;
        const matches = result.items
          .filter((item) => item.orderId === selectedOrderId)
          .sort((left, right) => left.cycleNumber - right.cycleNumber || left.deliveryId - right.deliveryId);
        const requested = requestedDeliveryId === null ? null : matches.find((item) => item.deliveryId === requestedDeliveryId) ?? null;
        const initial = requested ?? (matches.length === 1 ? matches[0] : null);
        setSelectedOrder(order);
        setOrderDeliveries(matches);
        setSelectedDelivery(initial);
        setRecipientName(initial?.recipientName?.trim() || user?.fullName?.trim() || "");
        setRecipientPhone(initial?.recipientPhone?.trim() || user?.phone?.trim() || "");
        setDeliveryAddress({
          address: initial?.shippingAddress?.trim() || order.shippingAddress?.trim() || user?.address?.trim() || "",
          latitude: order.shippingLatitude,
          longitude: order.shippingLongitude,
        });
        setPreview(null);
        setIsAccepted(false);
        setScheduledDeliveryAt(toCustomerDateTimeInput(initial?.scheduledDeliveryAt));
        setNotes(initial?.notes?.trim() || "");
      })
      .catch((requestError) => {
        if (active) setOrderError(getAuthErrorMessage(requestError, "Không thể tải đơn hàng để đặt lịch giao."));
      })
      .finally(() => { if (active) setOrderLoading(false); });
    return () => { active = false; };
  }, [requestedDeliveryId, selectedOrderId, user?.address, user?.fullName, user?.phone]);

  const windowCheck = useMemo(() => verifiedDeliveryWindow(selectedOrder, selectedDelivery), [selectedDelivery, selectedOrder]);
  const validWindow = windowCheck
    && "from" in windowCheck
    && windowCheck.from instanceof Date
    && windowCheck.to instanceof Date
    ? { from: windowCheck.from, to: windowCheck.to }
    : null;
  const deliveryLocked = selectedDelivery?.status === "SHIPPING" || selectedDelivery?.status === "DELIVERED";
  const deliveryWindowExpired = Boolean(validWindow && validWindow.to.getTime() <= renderedAt);
  const cycleVerified = selectedOrder?.orderType !== "TRAY_RENTAL" || Boolean(validWindow);
  const canSchedule = Boolean(selectedOrder && selectedDelivery && canScheduleOrderDelivery(selectedOrder.status) && !deliveryLocked && !deliveryWindowExpired && cycleVerified);
  const locationReady = Boolean(deliveryAddress.address.trim() && deliveryAddress.latitude !== null && deliveryAddress.longitude !== null && preview && (!preview.requiresAcceptance || isAccepted));
  const nowInput = toCustomerDateTimeInput(new Date(renderedAt + 60_000));
  const windowMin = validWindow && validWindow.from.getTime() > renderedAt ? toCustomerDateTimeInput(validWindow.from) : nowInput;
  const windowMax = validWindow ? toCustomerDateTimeInput(validWindow.to) : undefined;

  function chooseDelivery(deliveryId: number | null) {
    const delivery = deliveryId === null ? null : orderDeliveries.find((item) => item.deliveryId === deliveryId) ?? null;
    setSelectedDelivery(delivery);
    setRecipientName(delivery?.recipientName?.trim() || user?.fullName?.trim() || "");
    setRecipientPhone(delivery?.recipientPhone?.trim() || user?.phone?.trim() || "");
    setDeliveryAddress({
      address: delivery?.shippingAddress?.trim() || selectedOrder?.shippingAddress?.trim() || user?.address?.trim() || "",
      latitude: selectedOrder?.shippingLatitude ?? null,
      longitude: selectedOrder?.shippingLongitude ?? null,
    });
    setPreview(null);
    setIsAccepted(false);
    setScheduledDeliveryAt(toCustomerDateTimeInput(delivery?.scheduledDeliveryAt));
    setNotes(delivery?.notes?.trim() || "");
    setScheduleError("");
    setSuccess("");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setListError("");
    setPage(1);
    setSearch(searchInput.trim());
    setRefreshVersion((value) => value + 1);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setListError("");
    setPage(nextPage);
  }

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScheduleError("");
    setSuccess("");
    if (!selectedDelivery || !canSchedule) {
      setScheduleError("Hãy chọn một Delivery/chu kỳ hợp lệ đã được Backend tạo trước khi đặt lịch.");
      return;
    }
    if (!locationReady || deliveryAddress.latitude === null || deliveryAddress.longitude === null) {
      setScheduleError("Vui lòng nhập địa chỉ, chọn ghim và xác nhận lại vị trí giao hàng.");
      return;
    }
    const scheduledDate = new Date(`${scheduledDeliveryAt}:00+07:00`);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      setScheduleError("Vui lòng chọn thời gian giao trong tương lai.");
      return;
    }
    if (validWindow && (scheduledDate < validWindow.from || scheduledDate > validWindow.to)) {
      setScheduleError(`Thời gian giao phải nằm từ ${formatCustomerDate(validWindow.from)} đến ${formatCustomerDate(validWindow.to)}.`);
      return;
    }
    if (!recipientName.trim() || !recipientPhone.trim()) {
      setScheduleError("Vui lòng nhập đầy đủ người nhận và số điện thoại.");
      return;
    }
    setSubmitting(true);
    try {
      const delivery = await deliveryService.scheduleDeliveryById(selectedDelivery.deliveryId, {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        shippingAddress: deliveryAddress.address.trim(),
        scheduledDeliveryAt: scheduledDate.toISOString(),
        notes: notes.trim() || null,
        shippingLatitude: deliveryAddress.latitude,
        shippingLongitude: deliveryAddress.longitude,
        isAccepted: preview?.requiresAcceptance ? isAccepted : false,
        cycleNumber: selectedDelivery.cycleNumber,
        deliveryId: selectedDelivery.deliveryId,
      });
      setSelectedDelivery(delivery);
      setOrderDeliveries((current) => current.map((item) => item.deliveryId === delivery.deliveryId ? delivery : item));
      setSuccess(`Đã lưu lịch giao cho chu kỳ ${delivery.cycleNumber}.`);
      setLoading(true);
      setListError("");
      setRefreshVersion((value) => value + 1);
    } catch (requestError) {
      const acceptance = getDeliveryAcceptanceError(requestError);
      if (acceptance) {
        setIsAccepted(false);
        setPreview((current) => current ? { ...current, distanceKm: acceptance.distanceKm ?? current.distanceKm, isOutOfRange: true, requiresAcceptance: true } : current);
        setScheduleError("Địa chỉ nằm ngoài phạm vi tiêu chuẩn. Vui lòng xác nhận chấp nhận giao ngoài bán kính rồi thử lại.");
      } else {
        setScheduleError(getAuthErrorMessage(requestError, "Không thể đặt lịch giao hàng."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="mx-auto max-w-7xl px-6 py-10">
    <PageHeader title="Giao hàng của tôi" subtitle="Theo dõi lịch giao và thông tin nhận hàng theo từng chu kỳ." />
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section>
        <form onSubmit={submitSearch} className="mb-5 flex max-w-lg gap-2"><label className="relative min-w-0 flex-1"><span className="sr-only">Tìm giao hàng</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo mã đơn hoặc mã theo dõi..." className="h-11 w-full rounded-xl border border-[#e8f3eb] pl-10 pr-3 text-sm outline-none focus:border-[#4F8F68]" /></label><button className="rounded-xl border border-[#e8f3eb] px-4 text-sm font-semibold text-[#4F8F68]">Tìm</button></form>
        {listError ? <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-[#EF5350]">{listError}</div> : loading ? <div className="rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải thông tin giao hàng...</div> : deliveries.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dce9df] py-16 text-center"><Truck size={34} className="mx-auto text-[#9ab9a4]" /><h2 className="mt-4 font-bold">Chưa có Delivery nào</h2><p className="mt-2 text-sm text-[#6b7280]">FE chỉ cho đặt lịch sau khi Backend đã tạo Delivery cho đúng chu kỳ.</p></div> : <div className="space-y-4">{deliveries.map((delivery) => <article key={delivery.deliveryId} className="rounded-2xl border border-[#e8f3eb] bg-white p-5"><div className="flex flex-wrap items-center gap-3"><strong className="font-mono text-sm">{delivery.orderCode ?? `Đơn hàng #${delivery.orderId}`}</strong><StatusBadge tone={statusTone(delivery.status)}>{deliveryStatusLabel(delivery.status)}</StatusBadge><span className="rounded-full bg-[#f3f8f4] px-2.5 py-1 text-xs font-semibold text-[#356b4b]">Chu kỳ {delivery.cycleNumber}</span>{delivery.trackingCode && <span className="text-xs text-[#6b7280]">Mã theo dõi: {delivery.trackingCode}</span>}</div><p className="mt-4 flex gap-2 text-sm"><CalendarDays size={16} className="shrink-0 text-[#4F8F68]" /><span><span className="text-[#6b7280]">Lịch giao: </span>{formatCustomerDateTime(delivery.scheduledDeliveryAt)}</span></p>{delivery.deliveredAt && <p className="mt-2 pl-6 text-sm"><span className="text-[#6b7280]">Giao thực tế: </span>{formatCustomerDateTime(delivery.deliveredAt)}</p>}<p className="mt-3 flex gap-2 text-sm leading-5 text-[#6b7280]"><MapPin size={16} className="mt-0.5 shrink-0 text-[#4F8F68]" />{displayValue(delivery.shippingAddress)}</p><div className="mt-4 flex flex-wrap gap-4"><Link href={`/delivery/${delivery.deliveryId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#4F8F68]">Xem chi tiết <ArrowRight size={14} /></Link>{delivery.status !== "SHIPPING" && delivery.status !== "DELIVERED" && <Link href={`/delivery?order=${delivery.orderId}&delivery=${delivery.deliveryId}`} className="text-sm font-semibold text-[#315a43]">Đặt lịch chu kỳ {delivery.cycleNumber}</Link>}</div></article>)}</div>}
        {!listError && !loading && totalPages > 1 && <div className="mt-7 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-[#6b7280]">Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau</button></div>}
      </section>

      <aside className="rounded-2xl border border-[#e8f3eb] bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Đặt lịch giao hàng</h2>
        {!selectedOrderId ? <div className="mt-5 rounded-xl bg-[#f3f8f4] p-4 text-sm leading-6 text-[#5f6d63]">Mở một đơn hàng đủ điều kiện và chọn “Đặt lịch giao” để tiếp tục.</div> : orderLoading ? <p className="mt-5 text-sm text-[#6b7280]">Đang tải thông tin đơn hàng...</p> : orderError || !selectedOrder ? <><p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-[#b91c1c]">{orderError || "Không tìm thấy đơn hàng."}</p><Link href="/orders" className="mt-4 inline-flex text-sm font-semibold text-[#4F8F68]">Quay lại đơn hàng</Link></> : <>
          <div className="mt-4 rounded-xl bg-[#f3f8f4] p-4 text-sm"><p className="text-xs text-[#6b7280]">Đơn hàng</p><p className="mt-1 font-mono font-semibold">{selectedOrder.orderCode ?? `#${selectedOrder.orderId}`}</p></div>
          {orderDeliveries.length === 0 ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Backend chưa trả Delivery cho đơn này. FE không tự tạo hoặc đoán chu kỳ; vui lòng chờ SmartFarm khởi tạo lịch giao.</p> : <label className="mt-4 block text-sm font-semibold">Delivery và chu kỳ<select value={selectedDelivery?.deliveryId ?? ""} onChange={(event) => chooseDelivery(event.target.value ? Number(event.target.value) : null)} className={fieldClass}><option value="">Chọn Delivery cụ thể</option>{orderDeliveries.map((delivery) => <option key={delivery.deliveryId} value={delivery.deliveryId}>Delivery #{delivery.deliveryId} · Chu kỳ {delivery.cycleNumber} · {deliveryStatusLabel(delivery.status)}</option>)}</select></label>}
          {validWindow && <p className="mt-4 rounded-xl bg-[#fff8e1] p-4 text-sm leading-6 text-[#725c20]">Chu kỳ {selectedDelivery?.cycleNumber}: giao từ <strong>{formatCustomerDate(validWindow.from)}</strong> đến hết ngày <strong>{formatCustomerDate(validWindow.to)}</strong>.</p>}
          {windowCheck && "reason" in windowCheck && windowCheck.reason && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{windowCheck.reason} Thao tác đặt lịch được khóa để tránh Backend fallback sang Delivery khác.</p>}
          {selectedDelivery && !canSchedule && !(windowCheck && "reason" in windowCheck && windowCheck.reason) && <p className="mt-4 rounded-xl bg-[#f3f4f6] p-4 text-sm leading-6 text-[#5f6d63]">{deliveryLocked ? "Delivery này không thể thay đổi vì đang vận chuyển hoặc đã giao." : deliveryWindowExpired ? "Cửa sổ đặt lịch của chu kỳ này đã kết thúc." : "Đơn hàng chưa ở trạng thái cho phép đặt lịch."}</p>}
          <form onSubmit={schedule} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Người nhận<input required disabled={!canSchedule} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className={fieldClass} /></label><label className="block text-sm font-semibold">Số điện thoại<input required disabled={!canSchedule} type="tel" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} className={fieldClass} /></label><label className="block text-sm font-semibold">Lịch giao đã chọn<input type="datetime-local" disabled={!canSchedule} min={windowMin} max={windowMax} value={scheduledDeliveryAt} onChange={(event) => setScheduledDeliveryAt(event.target.value)} className={fieldClass} required /></label><div><p className="text-sm font-semibold">Địa chỉ và vị trí giao hàng</p><p className="mt-1 text-xs leading-5 text-[#6b7280]">Khi đổi địa chỉ, bạn phải chọn và xác nhận lại đầy đủ tọa độ. Không thể đổi sau khi Delivery bắt đầu vận chuyển.</p><div className="mt-3"><DeliveryAddressPicker value={deliveryAddress} onChange={setDeliveryAddress} preview={preview} onPreviewChange={setPreview} accepted={isAccepted} onAcceptedChange={setIsAccepted} disabled={!canSchedule || submitting} /></div></div><label className="block text-sm font-semibold">Ghi chú <span className="font-normal text-[#9ca3af]">(không bắt buộc)</span><textarea disabled={!canSchedule} value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#dce9df] bg-[#f8fbf9] px-4 py-3 text-sm outline-none focus:border-[#4F8F68] disabled:cursor-not-allowed disabled:bg-[#eef2ef]" /></label>{scheduleError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-[#EF5350]">{scheduleError}</p>}{success && <p role="status" className="rounded-lg bg-[#f3f8f4] p-3 text-sm text-[#3F7655]">{success}</p>}<button disabled={submitting || !canSchedule || !locationReady} className="h-12 w-full rounded-xl bg-[#4F8F68] px-4 text-sm font-semibold text-white hover:bg-[#3F7655] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Đang lưu..." : "Xác nhận lịch giao"}</button></form>
        </>}
      </aside>
    </div>
  </main>;
}
