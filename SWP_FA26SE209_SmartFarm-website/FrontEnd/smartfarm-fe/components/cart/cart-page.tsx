"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBasket, Sprout, X } from "lucide-react";

import { cartSubtotal } from "@/lib/user-cart";
import { formatVnd } from "@/lib/user-format";
import { useUserCart } from "@/components/user/cart-provider";
import { PageHeader, QuantityStepper, StatusBadge, UserImage } from "@/components/user/user-ui";
import { getAuthErrorMessage } from "@/lib/api";

export function CartPage() {
  const { items, changeQuantity, removeItem, refreshSeedPrices } = useUserCart();
  const [priceError, setPriceError] = useState("");
  useEffect(() => {
    let active = true;
    void refreshSeedPrices().catch((error) => {
      if (active) setPriceError(getAuthErrorMessage(error, "Không thể cập nhật giá bán mới nhất."));
    });
    return () => { active = false; };
  }, [refreshSeedPrices]);
  const hasPendingPrice = items.some((item) => item.backendPricePending);
  const hasLegacyRental = items.some((item) => item.type === "tray");

  return <div className="mx-auto max-w-7xl px-6 py-10">
    <PageHeader title="Giỏ hạt giống" subtitle={`${items.length} sản phẩm trong giỏ hàng`} />
    {priceError && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-[#b91c1c]">{priceError}</p>}
    {items.length === 0 ? <div className="rounded-2xl border border-[#e8f3eb] py-20 text-center"><ShoppingBasket size={42} className="mx-auto text-[#4F8F68]" /><h2 className="mt-5 text-xl font-bold">Giỏ hàng trống</h2><p className="mt-2 text-sm text-[#6b7280]">Khám phá hạt giống để bắt đầu.</p><Link href="/seeds" className="mt-6 inline-flex rounded-xl bg-[#4F8F68] px-6 py-3 text-sm font-semibold text-white">Xem hạt giống</Link></div> : <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">{items.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-[#e8f3eb] bg-white p-4 sm:p-5"><div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3f8f4] text-[#4F8F68]">{item.image ? <UserImage src={item.image} alt={item.name} /> : <Sprout size={34} />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><StatusBadge tone={item.type === "seed" ? "green" : "blue"}>{item.type === "seed" ? "Hạt giống" : "Mục thuê khay cũ"}</StatusBadge><h2 className="mt-2 text-sm font-semibold sm:text-base">{item.name}</h2></div><button type="button" onClick={() => removeItem(item.id)} aria-label={`Xóa ${item.name}`} className="self-start rounded-lg p-1 text-[#9ca3af] hover:text-[#EF5350]"><X size={18} /></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><QuantityStepper value={item.qty} onChange={(next) => changeQuantity(item.id, next - item.qty)} /><strong className="text-sm text-[#4F8F68] sm:text-base">{item.backendPricePending ? "Chưa có giá tạm tính" : formatVnd(item.price * item.qty)}</strong></div></div></article>)}<div className="flex flex-wrap gap-5 pt-3 text-sm font-semibold text-[#4F8F68]"><Link href="/seeds">+ Thêm hạt giống</Link><Link href="/rent-tray">Thuê khay</Link></div></div>
      <aside><div className="rounded-2xl border border-[#e8f3eb] bg-white p-6 shadow-sm lg:sticky lg:top-24"><h2 className="text-xl font-bold">Tóm tắt giỏ hàng</h2><div className="mt-6 flex justify-between text-sm"><span className="text-[#6b7280]">Tạm tính</span><strong>{hasPendingPrice ? "Chưa có giá tạm tính" : formatVnd(cartSubtotal(items))}</strong></div><p className="mt-4 text-xs leading-5 text-[#6b7280]">Số tiền cần thanh toán sẽ hiển thị trước khi thanh toán.</p>{hasLegacyRental && <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Mục thuê khay này không còn phù hợp. Hãy xóa mục và chọn lại tại trang Thuê khay.</p>}<Link href="/checkout" className="mt-6 block rounded-xl bg-[#4F8F68] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#3F7655]">Tiếp tục đặt hàng</Link><Link href="/seeds" className="mt-4 block text-center text-sm text-[#6b7280] hover:text-[#4F8F68]">Tiếp tục chọn giống</Link></div></aside>
    </div>}
  </div>;
}
