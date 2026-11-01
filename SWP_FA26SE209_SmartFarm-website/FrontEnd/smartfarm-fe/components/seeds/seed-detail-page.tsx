"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleAlert, Clock3, LoaderCircle, PackageOpen, Ruler, ShieldAlert, ShoppingCart, Sprout } from "lucide-react";

import { Breadcrumb } from "@/components/user/user-ui";
import { ApiError, getAuthErrorMessage, seedService, type SeedVariety } from "@/lib/api";
import { formatVnd } from "@/lib/user-format";
import { useUserCart } from "@/components/user/cart-provider";
import { seedPacketCartItem } from "@/lib/user-cart";

export function SeedDetailPage({
  seedId,
  basePath = "/seeds",
}: {
  seedId: string;
  basePath?: "/seeds" | "/seed-varieties";
}) {
  const [seed, setSeed] = useState<SeedVariety | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const { addItem, items } = useUserCart();

  useEffect(() => {
    let active = true;
    const id = Number(seedId);
    if (!Number.isInteger(id) || id <= 0) {
      queueMicrotask(() => { if (active) { setNotFound(true); setLoading(false); } });
      return () => { active = false; };
    }
    void seedService.getSeedVariety(id)
      .then((data) => { if (active) setSeed(data); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true);
        else setError(getAuthErrorMessage(requestError, "Không thể tải thông tin giống cây."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [seedId]);

  if (loading) return <main className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-6 py-24 text-sm text-[#6b7280]"><LoaderCircle size={19} className="animate-spin" />Đang tải giống cây...</main>;
  if (notFound) return <main className="mx-auto max-w-3xl px-6 py-20 text-center"><Sprout size={42} className="mx-auto text-[#4F8F68]" /><h1 className="mt-4 text-2xl font-bold">Không tìm thấy giống cây</h1><Link href={basePath} className="mt-6 inline-block text-sm font-semibold text-[#4F8F68]">Quay lại danh sách</Link></main>;
  if (error || !seed) return <main className="mx-auto max-w-3xl px-6 py-20 text-center text-[#b91c1c]"><CircleAlert size={38} className="mx-auto" /><p className="mt-4 text-sm">{error || "Không thể tải thông tin giống cây."}</p></main>;

  const name = seed.name || `Giống cây #${seed.seedVarietyId}`;
  const hasSalePrice = Number.isFinite(seed.salePricePerPacket) && seed.salePricePerPacket > 0;
  const hasOtherSeed = items.some((item) => item.type === "seed" && item.seedId !== String(seed.seedVarietyId));
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Giống rau mầm", href: basePath }, { label: name }]} />
      <div className="grid overflow-hidden rounded-2xl border border-[#e8f3eb] bg-white md:grid-cols-2">
        <div className="flex min-h-72 items-center justify-center bg-gradient-to-br from-[#E8F3EB] to-[#f7fbf8] text-[#4F8F68]"><Sprout size={92} strokeWidth={1.2} /></div>
        <div className="p-7 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">Giống dùng cho khay thuê</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{name}</h1>
          <p className="mt-5 text-sm leading-7 text-[#6b7280]">{seed.description || "Chưa có mô tả cho giống cây này."}</p>
          <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f3f8f4] p-4"><p className="flex items-center gap-1 text-xs text-[#6b7280]"><Clock3 size={14} />Thời gian phát triển</p><p className="mt-2 font-semibold">{seed.growthDays} ngày</p></div><div className="rounded-xl bg-[#f3f8f4] p-4"><p className="text-xs text-[#6b7280]">Giá bán gói hạt</p><p className="mt-2 font-semibold text-[#4F8F68]">{hasSalePrice ? formatVnd(seed.salePricePerPacket) : "Chưa có giá bán"}</p><p className="mt-1 text-[11px] text-[#6b7280]">Giá thuê: {formatVnd(seed.rentalPricePerTray)}/khay/chu kỳ</p></div></div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#e8f3eb] p-4"><dt className="flex items-center gap-2 text-xs text-[#6b7280]"><PackageOpen size={14} />Sản lượng dự kiến</dt><dd className="mt-2 text-sm font-semibold">{seed.expectedYield || "Chưa có thông tin"}</dd></div><div className="rounded-xl border border-[#e8f3eb] p-4"><dt className="flex items-center gap-2 text-xs text-[#6b7280]"><Ruler size={14} />Kích thước khay</dt><dd className="mt-2 text-sm font-semibold">{seed.standardTraySize || "Chưa có thông tin"}</dd></div></dl>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-amber-900"><ShieldAlert size={17} />Rủi ro gieo trồng</p><p className="mt-2 text-sm leading-6 text-amber-800">{seed.riskDescription || "Chưa có cảnh báo rủi ro riêng cho giống này."}</p></div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/rent-tray" className="inline-flex rounded-xl bg-[#4F8F68] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3F7655]">Thuê khay với giống này</Link><button type="button" disabled={hasOtherSeed || !hasSalePrice} onClick={() => addItem(seedPacketCartItem(seed))} className="inline-flex items-center gap-2 rounded-xl border border-[#4F8F68] px-6 py-3 text-sm font-semibold text-[#4F8F68] hover:bg-[#f3f8f4] disabled:cursor-not-allowed disabled:opacity-45"><ShoppingCart size={16} />{hasOtherSeed ? "Giỏ đang có loại khác" : "Mua gói hạt"}</button></div>
        </div>
      </div>
    </main>
  );
}
