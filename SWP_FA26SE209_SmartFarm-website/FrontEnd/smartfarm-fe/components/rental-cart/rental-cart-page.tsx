"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  LoaderCircle,
  ShoppingBasket,
  Sprout,
  Trash2,
} from "lucide-react";

import {
  ApiError,
  getAuthErrorMessage,
  getDeliveryAcceptanceError,
  rentalCartService,
  seedService,
  type RentalCart,
  type RentalCartItem,
} from "@/lib/api";
import { formatCustomerDate, formatVnd } from "@/lib/user-format";
import { consumeRentalRiskConsent, rememberRentalRiskConsent } from "@/lib/rental-risk-consent";
import { PageHeader } from "@/components/user/user-ui";
import { DeliveryAddressPicker } from "@/components/delivery/delivery-address-picker";
import { clearDeliveryAddressDraft, useDeliveryAddressDraft } from "@/lib/delivery-address";
import {
  summarizeRentalCartSelection,
  synchronizeRentalCartSelection,
} from "@/lib/rental-cart-selection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CartAction = "clear" | "checkout" | number | null;

export function RentalCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<RentalCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<CartAction>(null);
  const [error, setError] = useState("");
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<RentalCartItem | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const previousCartIdsRef = useRef<Set<number>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const checkoutInFlightRef = useRef(false);
  const cartMutationInFlightRef = useRef(false);
  const { value: deliveryAddress, setValue: setDeliveryAddress, preview, setPreview, isAccepted, setIsAccepted } = useDeliveryAddressDraft();

  const items = cart?.items ?? [];
  const selection = cart ? summarizeRentalCartSelection(cart, selectedIds) : null;
  const allSelected = items.length > 0 && selection?.itemCount === items.length;
  const partiallySelected = Boolean(selection?.itemCount) && !allSelected;

  useEffect(() => {
    if (!cart) return;
    const nextItems = cart.items ?? [];
    setSelectedIds((current) => synchronizeRentalCartSelection(
      current,
      previousCartIdsRef.current,
      nextItems,
    ));
    previousCartIdsRef.current = new Set(nextItems.map((item) => item.cartItemId));
  }, [cart]);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  function toggleItem(cartItemId: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(cartItemId);
      else next.delete(cartItemId);
      return next;
    });
    setError("");
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(items.map((item) => item.cartItemId)) : new Set());
    setError("");
  }

  async function reloadCart() {
    setLoading(true);
    setError("");
    try {
      setCart(await rentalCartService.getCart());
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể tải giỏ thuê khay."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void rentalCartService.getCart()
      .then((data) => { if (active) { setCart(data); setRiskAccepted(consumeRentalRiskConsent()); } })
      .catch((requestError) => {
        if (active) setError(getAuthErrorMessage(requestError, "Không thể tải giỏ thuê khay."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function requestItemRemoval(item: RentalCartItem) {
    if (action !== null) return;
    setConfirmationError("");
    setPendingRemoval(item);
  }

  async function confirmItemRemoval() {
    if (cartMutationInFlightRef.current || action !== null || !pendingRemoval) return;
    const cartItemId = pendingRemoval.cartItemId;
    cartMutationInFlightRef.current = true;
    setAction(cartItemId);
    setError("");
    setConfirmationError("");
    try {
      setCart(await rentalCartService.removeItem(cartItemId));
      setPendingRemoval(null);
    } catch (requestError) {
      setConfirmationError(getAuthErrorMessage(requestError, "Không thể xóa khay khỏi giỏ thuê."));
    } finally {
      cartMutationInFlightRef.current = false;
      setAction(null);
    }
  }

  async function confirmClearCart() {
    if (cartMutationInFlightRef.current || action !== null) return;
    cartMutationInFlightRef.current = true;
    setAction("clear");
    setError("");
    setConfirmationError("");
    try {
      setCart(await rentalCartService.clearCart());
      rememberRentalRiskConsent(false);
      setRiskAccepted(false);
      setClearDialogOpen(false);
    } catch (requestError) {
      setConfirmationError(getAuthErrorMessage(requestError, "Không thể xóa giỏ thuê."));
    } finally {
      cartMutationInFlightRef.current = false;
      setAction(null);
    }
  }

  async function checkout() {
    if (checkoutInFlightRef.current || action !== null || !cart || !selection?.itemCount) return;
    if (!riskAccepted) {
      setError("Vui lòng xác nhận rủi ro gieo trồng trước khi tạo đơn thuê.");
      return;
    }
    if (!deliveryAddress.address.trim() || deliveryAddress.latitude === null || deliveryAddress.longitude === null || !preview) {
      setError("Vui lòng nhập địa chỉ, chọn ghim và xác nhận vị trí giao hàng.");
      return;
    }
    if (preview.requiresAcceptance && !isAccepted) {
      setError("Vui lòng xác nhận giao hàng ngoài bán kính để tiếp tục.");
      return;
    }
    checkoutInFlightRef.current = true;
    setAction("checkout");
    setError("");
    const cartItemIds = selection.items.map((item) => item.cartItemId);
    try {
      const order = await rentalCartService.checkout({
        isRiskAccepted: riskAccepted,
        shippingAddress: deliveryAddress.address.trim(),
        shippingLatitude: deliveryAddress.latitude,
        shippingLongitude: deliveryAddress.longitude,
        isAccepted: preview.requiresAcceptance ? isAccepted : false,
        cartItemIds,
      });
      try {
        setCart(await rentalCartService.getCart());
      } catch {
        // Checkout already succeeded. Keep the last cart snapshot and continue to payment.
      }
      rememberRentalRiskConsent(false);
      clearDeliveryAddressDraft();
      router.push(`/payment/${order.orderId}`);
    } catch (requestError) {
      const acceptance = getDeliveryAcceptanceError(requestError);
      if (acceptance) {
        setIsAccepted(false);
        setPreview((current) => current ? {
          ...current,
          distanceKm: acceptance.distanceKm ?? current.distanceKm,
          isOutOfRange: true,
          requiresAcceptance: true,
        } : current);
        setError("Địa chỉ nằm ngoài phạm vi tiêu chuẩn. Vui lòng xác nhận chấp nhận giao ngoài bán kính rồi thử lại.");
      } else if (requestError instanceof ApiError && requestError.status === 409) {
        try {
          const [nextCart, count] = await Promise.all([
            rentalCartService.getCart(),
            seedService.getAvailableTrayCount(),
          ]);
          setCart(nextCart);
          setError(cartItemIds.length > count.available
            ? `Số khay còn trống đã thay đổi. Bạn đang chọn ${cartItemIds.length} khay nhưng hiện chỉ còn ${count.available} khay. Vui lòng giảm số lượng để tiếp tục.`
            : getAuthErrorMessage(requestError, "Chưa thể xác nhận đơn thuê. Vui lòng kiểm tra lại giỏ hàng."));
        } catch {
          // Keep the checkout conflict visible and preserve the last known cart.
          setError("Không đủ khay trống và chưa thể cập nhật số lượng hiện có. Vui lòng thử lại sau.");
        }
      } else {
        setError(getAuthErrorMessage(requestError, "Không thể xác nhận đơn thuê. Vui lòng thử lại."));
      }
      checkoutInFlightRef.current = false;
      setAction(null);
    }
  }

  if (loading) {
    return <main className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-24 text-sm text-[#6b7280]"><LoaderCircle size={19} className="animate-spin" />Đang tải giỏ thuê...</main>;
  }

  if (!cart) {
    return <main className="mx-auto max-w-3xl px-6 py-20 text-center"><CircleAlert size={40} className="mx-auto text-[#EF5350]" /><h1 className="mt-4 text-2xl font-bold">Không thể tải giỏ thuê</h1><p role="alert" className="mt-3 text-sm text-[#6b7280]">{error}</p><button type="button" onClick={() => void reloadCart()} className="mt-6 rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white">Thử lại</button></main>;
  }

  if (items.length === 0) {
    return <main className="mx-auto max-w-4xl px-6 py-12"><PageHeader title="Giỏ thuê khay" subtitle="Các khay bạn chọn sẽ xuất hiện tại đây." /><div className="rounded-2xl border border-[#e8f3eb] bg-white px-6 py-20 text-center"><ShoppingBasket size={44} className="mx-auto text-[#4F8F68]" /><h2 className="mt-5 text-xl font-bold">Giỏ hàng chưa có khay nào</h2><p className="mt-2 text-sm text-[#6b7280]">Khay được giữ sau khi bạn xác nhận đơn thuê.</p><Link href="/rent-tray" className="mt-6 inline-flex rounded-xl bg-[#4F8F68] px-6 py-3 text-sm font-semibold text-white">Chọn khay thuê</Link></div></main>;
  }

  return (
    <>
    <main className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader
        title="Giỏ thuê khay"
        subtitle={`${cart.itemCount} khay đang chờ xác nhận`}
        action={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"><Link href="/rent-tray" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#b8d7c1] px-4 text-sm font-semibold text-[#3F7655] transition-colors hover:bg-[#f3f8f4]">+ Thêm khay khác</Link><button type="button" onClick={() => { setConfirmationError(""); setClearDialogOpen(true); }} disabled={action !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 px-4 text-sm font-semibold text-[#EF5350] transition-colors hover:bg-red-50 disabled:opacity-50">Xóa toàn bộ giỏ hàng</button></div>}
      />
      {error && <p role="alert" className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#EF5350]">{error}</p>}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8f3eb] bg-white px-5 py-4 shadow-sm">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#19382b]">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={(event) => toggleAll(event.target.checked)}
                disabled={action !== null}
                className="size-4 accent-[#4F8F68]"
              />
              Chọn tất cả
            </label>
            <p className="text-sm text-[#6b7280]">Đã chọn <span className="font-semibold text-[#3F7655]">{selection?.itemCount ?? 0}/{items.length}</span> khay</p>
          </div>
          {items.map((item, index) => (
            <article key={item.cartItemId} className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors ${selectedIds.has(item.cartItemId) ? "border-[#b8d7c1]" : "border-[#e8f3eb]"}`}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.cartItemId)}
                  onChange={(event) => toggleItem(item.cartItemId, event.target.checked)}
                  disabled={action !== null}
                  aria-label={`Chọn ${item.seedVarietyName || `giống #${item.seedVarietyId}`} để thanh toán`}
                  className="mt-4 size-4 shrink-0 accent-[#4F8F68]"
                />
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#4F8F68]"><Sprout size={24} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-[#4F8F68]">Khay {index + 1}</p><h2 className="mt-1 font-bold text-[#1a2e1f]">{item.seedVarietyName || `Giống #${item.seedVarietyId}`}</h2><p className="mt-1 text-xs text-[#6b7280]">{item.farmAreaName || "SmartFarm sẽ sắp xếp khu trồng"} · {item.quantity} khay · {item.totalCycles} đợt trồng</p>{item.targetPlantingDate && <p className="mt-1 text-xs text-[#6b7280]">Ngày gieo: {formatCustomerDate(item.targetPlantingDate)}</p>}</div>
                    <button type="button" onClick={() => requestItemRemoval(item)} disabled={action !== null} aria-label={`Xóa ${item.seedVarietyName || `giống #${item.seedVarietyId}`} khỏi giỏ thuê`} className="rounded-lg p-2 text-[#9ca3af] hover:bg-red-50 hover:text-[#EF5350] disabled:opacity-50"><Trash2 size={18} /></button>
                  </div>
                  <dl className="mt-5 grid gap-3 rounded-xl bg-[#f3f8f4] p-4 text-sm sm:grid-cols-3"><div><dt className="text-xs text-[#6b7280]">Giá mỗi chu kỳ</dt><dd className="mt-1 font-semibold tabular-nums">{formatVnd(item.rentalPrice)}</dd></div><div><dt className="text-xs text-[#6b7280]">Số chu kỳ</dt><dd className="mt-1 font-semibold tabular-nums">{item.totalCycles}</dd></div><div className="sm:text-right"><dt className="text-xs text-[#6b7280]">Thành tiền</dt><dd className="mt-1 font-bold tabular-nums text-[#4F8F68]">{formatVnd(item.lineTotal)}</dd></div></dl>
                </div>
              </div>
            </article>
          ))}
          <section className="rounded-2xl border border-[#e8f3eb] bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-[#19382b]">Địa chỉ giao hàng</h2><p className="mt-1 text-xs leading-5 text-[#6b7280]">Vị trí này dùng chung cho toàn bộ khay trong đơn thuê.</p><div className="mt-5"><DeliveryAddressPicker value={deliveryAddress} onChange={setDeliveryAddress} preview={preview} onPreviewChange={setPreview} accepted={isAccepted} onAcceptedChange={setIsAccepted} disabled={action !== null} /></div></section>

        </section>

        <aside>
          <div className="rounded-2xl border border-[#e8f3eb] bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold">Thông tin đơn thuê</h2>
            <dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#6b7280]">Số khay đã chọn</dt><dd className="font-semibold">{selection?.itemCount ?? 0}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#6b7280]">Tạm tính tiền thuê</dt><dd className="font-semibold tabular-nums">{formatVnd(selection?.subtotal ?? 0)}</dd></div>{Boolean(selection?.discountAmount) && <div className="flex justify-between gap-4 text-[#3F7655]"><dt>Giảm giá ({selection?.discountPercent.toLocaleString("vi-VN")}%)</dt><dd className="font-semibold tabular-nums">−{formatVnd(selection?.discountAmount ?? 0)}</dd></div>}<div className="flex justify-between gap-4 border-t border-[#e8f3eb] pt-4 text-base"><dt className="font-bold">Tổng thanh toán dự kiến</dt><dd className="font-bold tabular-nums text-[#4F8F68]">{formatVnd(selection?.total ?? 0)}</dd></div></dl>

            <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Thêm vào giỏ chưa giữ khay. Khay chỉ được giữ sau khi bạn xác nhận đơn thuê thành công.</p>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f3f8f4] p-4 text-sm leading-6"><input type="checkbox" checked={riskAccepted} onChange={(event) => { setRiskAccepted(event.target.checked); setError(""); }} className="mt-1 size-4 accent-[#4F8F68]" /><span>Tôi đã đọc và chấp nhận điều khoảng gieo trồng của các giống trong giỏ.</span></label>
            <button type="button" onClick={() => void checkout()} disabled={action !== null || !selection?.itemCount || !riskAccepted || !preview || (preview.requiresAcceptance && !isAccepted)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3F7655] disabled:cursor-not-allowed disabled:opacity-50">{action === "checkout" && <LoaderCircle size={17} className="animate-spin" />}{action === "checkout" ? "Đang tạo đơn..." : "Tạo đơn và thanh toán ngay"}</button>
          </div>
        </aside>
      </div>
    </main>

    <Dialog open={pendingRemoval !== null} onOpenChange={(open) => { if (!open && action === null) { setPendingRemoval(null); setConfirmationError(""); } }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Xóa khay khỏi giỏ thuê?</DialogTitle>
          <DialogDescription>Bạn có chắc chắn muốn xóa khay này khỏi giỏ thuê không?</DialogDescription>
        </DialogHeader>
        {confirmationError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#EF5350]">{confirmationError}</p>}
        <DialogFooter>
          <button type="button" onClick={() => { setPendingRemoval(null); setConfirmationError(""); }} disabled={action !== null} className="min-h-10 rounded-xl border border-[#dce9df] px-4 text-sm font-semibold text-[#365b46] hover:bg-[#f3f8f4] disabled:opacity-50">Hủy</button>
          <button type="button" onClick={() => void confirmItemRemoval()} disabled={action !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#EF5350] px-4 text-sm font-semibold text-white hover:bg-[#dc4744] disabled:opacity-60">{typeof action === "number" && <LoaderCircle size={16} className="animate-spin" />}{typeof action === "number" ? "Đang xóa..." : "Xóa khay"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={clearDialogOpen} onOpenChange={(open) => { if (action === null) { setClearDialogOpen(open); if (!open) setConfirmationError(""); } }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Xóa toàn bộ giỏ thuê?</DialogTitle>
          <DialogDescription>Toàn bộ khay trong giỏ sẽ bị xóa. Hành động này không thể hoàn tác.</DialogDescription>
        </DialogHeader>
        {confirmationError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#EF5350]">{confirmationError}</p>}
        <DialogFooter>
          <button type="button" onClick={() => { setClearDialogOpen(false); setConfirmationError(""); }} disabled={action !== null} className="min-h-10 rounded-xl border border-[#dce9df] px-4 text-sm font-semibold text-[#365b46] hover:bg-[#f3f8f4] disabled:opacity-50">Hủy</button>
          <button type="button" onClick={() => void confirmClearCart()} disabled={action !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#EF5350] px-4 text-sm font-semibold text-white hover:bg-[#dc4744] disabled:opacity-60">{action === "clear" && <LoaderCircle size={16} className="animate-spin" />}{action === "clear" ? "Đang xóa..." : "Xóa toàn bộ"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
