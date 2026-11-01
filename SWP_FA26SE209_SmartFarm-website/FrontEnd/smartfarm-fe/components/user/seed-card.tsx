"use client";

import Link from "next/link";
import { Clock3, ShoppingCart, Sprout } from "lucide-react";

import type { SeedVariety } from "@/lib/api";
import { seedPacketCartItem } from "@/lib/user-cart";
import { formatVnd } from "@/lib/user-format";
import { useUserCart } from "@/components/user/cart-provider";

export function SeedCard({ seed, basePath = "/seeds" }: { seed: SeedVariety; basePath?: "/seeds" | "/seed-varieties" }) {
  const { addItem, items } = useUserCart();
  const name = seed.name || `Giống cây #${seed.seedVarietyId}`;
  const detailHref = `${basePath}/${seed.seedVarietyId}`;
  const hasOtherSeed = items.some((item) => item.type === "seed" && item.seedId !== String(seed.seedVarietyId));
  const hasSalePrice = Number.isFinite(seed.salePricePerPacket) && seed.salePricePerPacket > 0;

  return <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#e8f3eb] bg-white shadow-sm transition-shadow hover:shadow-lg">
    <Link href={detailHref} className="flex h-44 items-center justify-center bg-gradient-to-br from-[#E8F3EB] to-[#f7fbf8] text-[#4F8F68]"><Sprout size={58} strokeWidth={1.4} aria-hidden="true" /></Link>
    <div className="flex flex-1 flex-col p-5">
      <h2 className="text-lg font-bold"><Link href={detailHref} className="hover:text-[#4F8F68]">{name}</Link></h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6b7280]">{seed.description || "Chưa có mô tả cho giống cây này."}</p>
      <div className="mt-auto grid gap-2 pt-5"><div className="flex items-end justify-between gap-3"><p className="text-lg font-bold text-[#4F8F68]">{hasSalePrice ? formatVnd(seed.salePricePerPacket) : "Chưa có giá bán"}<span className="text-xs font-normal text-[#6b7280]">/gói hạt</span></p><p className="flex items-center gap-1 text-xs text-[#6b7280]"><Clock3 size={13} />{seed.growthDays} ngày</p></div><p className="text-xs text-[#6b7280]">Giá thuê: <strong className="text-[#19382b]">{formatVnd(seed.rentalPricePerTray)}/khay/chu kỳ</strong></p></div>
      <div className="mt-5 grid grid-cols-2 gap-2"><Link href={detailHref} className="rounded-xl border border-[#e8f3eb] px-3 py-2.5 text-center text-xs font-semibold text-[#4F8F68] hover:bg-[#f3f8f4]">Chi tiết</Link><Link href="/rent-tray" className="rounded-xl bg-[#4F8F68] px-3 py-2.5 text-center text-xs font-semibold text-white hover:bg-[#3F7655]">Thuê khay</Link></div>
      <button type="button" disabled={hasOtherSeed || !hasSalePrice} onClick={() => addItem(seedPacketCartItem(seed))} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#4F8F68] px-3 py-2.5 text-xs font-semibold text-[#4F8F68] hover:bg-[#f3f8f4] disabled:cursor-not-allowed disabled:opacity-45"><ShoppingCart size={14} />{hasOtherSeed ? "Giỏ đang có loại hạt khác" : "Thêm gói hạt vào giỏ"}</button>
      <p className="mt-2 text-center text-[11px] leading-4 text-[#7c8780]">Mỗi đơn mua hạt hỗ trợ một loại giống. Giá sẽ được đồng bộ lại trước khi đặt hàng.</p>
    </div>
  </article>;
}
