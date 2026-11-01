"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { getAuthErrorMessage, getDeliveryAcceptanceError, orderService } from "@/lib/api";
import { formatVnd } from "@/lib/user-format";
import { useUserCart } from "@/components/user/cart-provider";
import { PageHeader } from "@/components/user/user-ui";
import { DeliveryAddressPicker } from "@/components/delivery/delivery-address-picker";
import { clearDeliveryAddressDraft, useDeliveryAddressDraft } from "@/lib/delivery-address";

export function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, refreshSeedPrices } = useUserCart();
  const { value: deliveryAddress, setValue: setDeliveryAddress, preview, setPreview, isAccepted, setIsAccepted } = useDeliveryAddressDraft();
  const [submitting, setSubmitting] = useState(false);
  const [syncingPrice, setSyncingPrice] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void refreshSeedPrices().catch((requestError) => {
      if (active) setError(getAuthErrorMessage(requestError, "Không thể cập nhật giá bán mới nhất."));
    }).finally(() => { if (active) setSyncingPrice(false); });
    return () => { active = false; };
  }, [refreshSeedPrices]); // Refresh once when checkout opens; submit refreshes again.

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const seedItems = items.filter((item) => item.type === "seed");

    if (items.some((item) => item.type === "tray")) {
      setError("Đơn thuê khay cần được xác nhận tại trang Thuê khay. Vui lòng xóa mục thuê khay khỏi giỏ hàng này.");
      return;
    }
    if (seedItems.length === 0) {
      setError("Giỏ hàng chưa có gói hạt giống để tạo đơn.");
      return;
    }
    if (seedItems.length > 1) {
      setError("Mỗi đơn hàng chỉ có thể gồm một loại hạt giống. Vui lòng giữ lại một loại để tiếp tục.");
      return;
    }
    if (!deliveryAddress.address.trim() || deliveryAddress.latitude === null || deliveryAddress.longitude === null || !preview) {
      setError("Vui lòng nhập địa chỉ, chọn ghim và xác nhận vị trí giao hàng.");
      return;
    }
    if (preview.requiresAcceptance && !isAccepted) { setError("Vui lòng xác nhận giao hàng ngoài bán kính để tiếp tục."); return; }

    let item = seedItems[0];
    const seedVarietyId = Number(item.seedId);
    if (!Number.isInteger(seedVarietyId) || seedVarietyId <= 0 || item.qty <= 0) {
      setError(`Thông tin sản phẩm “${item.name}” đã cũ. Vui lòng xóa khỏi giỏ và chọn lại từ danh mục hạt giống.`);
      return;
    }

    setSubmitting(true);
    try {
      const refreshedItems = await refreshSeedPrices();
      item = refreshedItems.find((entry) => entry.id === item.id) ?? item;
      if (item.backendPricePending || item.price <= 0) throw new Error("Backend chưa trả về giá bán hợp lệ cho giống đã chọn.");
      const order = await orderService.createSeedPacketOrder({
        seedVarietyId,
        quantity: item.qty,
        shippingAddress: deliveryAddress.address.trim(),
        shippingLatitude: deliveryAddress.latitude,
        shippingLongitude: deliveryAddress.longitude,
        isAccepted: preview.requiresAcceptance ? isAccepted : false,
      });
      removeItem(item.id);
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
      } else setError(getAuthErrorMessage(requestError, "Không thể tạo đơn hàng."));
      setSubmitting(false);
    }
  }

  return <div className="mx-auto max-w-7xl px-6 py-10">
    <PageHeader title="Xác nhận đơn mua hạt giống" subtitle="Kiểm tra thông tin trước khi đặt hàng." />
    <form onSubmit={createOrder} className="grid gap-8 lg:grid-cols-5">
      <section className="rounded-2xl border border-[#e8f3eb] bg-white p-6 lg:col-span-3"><h2 className="text-xl font-bold">Thông tin giao hàng</h2><div className="mt-6"><DeliveryAddressPicker value={deliveryAddress} onChange={setDeliveryAddress} preview={preview} onPreviewChange={setPreview} accepted={isAccepted} onAcceptedChange={setIsAccepted} disabled={submitting} /></div><div className="mt-6 rounded-xl bg-[#f3f8f4] p-4 text-sm leading-6 text-[#6b7280]">Mỗi đơn hàng gồm một loại hạt giống. Bạn sẽ xem hướng dẫn thanh toán sau khi đặt hàng.</div></section>
      <aside className="lg:col-span-2"><div className="rounded-2xl border border-[#e8f3eb] bg-white p-6 shadow-sm lg:sticky lg:top-24"><h2 className="text-xl font-bold">Sản phẩm trong giỏ</h2><div className="mt-5 space-y-4">{items.length === 0 ? <p className="text-sm text-[#6b7280]">Giỏ hàng trống.</p> : items.map((cartItem) => <div key={cartItem.id} className="flex justify-between gap-3 text-sm"><span>{cartItem.name} × {cartItem.qty}</span><span className="shrink-0 text-[#6b7280]">{cartItem.type !== "seed" ? "Vui lòng xóa sản phẩm này" : syncingPrice || cartItem.backendPricePending ? "Đang cập nhật giá..." : formatVnd(cartItem.price * cartItem.qty)}</span></div>)}</div><p className="mt-6 border-t border-[#e8f3eb] pt-5 text-xs leading-5 text-[#6b7280]">Giá được đồng bộ từ danh mục trước khi đặt. Tổng chính thức do Backend trả về sau khi tạo đơn.</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#EF5350]">{error}</p>}<button type="submit" disabled={submitting || syncingPrice || items.length === 0 || !preview || (preview.requiresAcceptance && !isAccepted)} className="mt-6 w-full rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3F7655] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Đang đặt hàng..." : "Đặt hàng và thanh toán"}</button><p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#9ca3af]"><LockKeyhole size={13} />Bạn có thể kiểm tra trước khi thanh toán</p><Link href="/cart" className="mt-4 block text-center text-sm text-[#6b7280]">Quay lại giỏ hàng</Link></div></aside>
    </form>
  </div>;
}
