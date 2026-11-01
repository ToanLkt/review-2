"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Search, ShoppingBag, ShoppingCart, Sprout } from "lucide-react";

import {
  canPayOrder,
  getAuthErrorMessage,
  orderService,
  orderStatusLabel,
  orderStatusTone,
  orderTypeLabel,
  type OrderSummary,
} from "@/lib/api";
import { formatCustomerDate, formatCustomerDateTime, formatVnd, parseBackendDate } from "@/lib/user-format";
import { PageHeader, StatusBadge } from "@/components/user/user-ui";

const apiPageSize = 100;
const displayPageSize = 10;
type OrderTab = "rentals" | "seeds";

function isPayableOrder(order: OrderSummary) {
  const dueAt = parseBackendDate(order.paymentDueAt)?.getTime() ?? Number.NaN;
  const acceptsRisk = order.orderType !== "TRAY_RENTAL" || order.isRiskAccepted;
  return canPayOrder(order.status) && acceptsRisk && Number.isFinite(dueAt) && dueAt > Date.now();
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [tab, setTab] = useState<OrderTab>("rentals");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAllOrders() {
      setLoading(true);
      setError("");
      try {
        const first = await orderService.getOrders({ search, page: 1, pageSize: apiPageSize });
        const pages = first.totalPages > 1
          ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => orderService.getOrders({ search, page: index + 2, pageSize: apiPageSize })))
          : [];
        if (active) setOrders([first, ...pages].flatMap((result) => result.items));
      } catch (requestError) {
        if (active) setError(getAuthErrorMessage(requestError, "Không thể tải danh sách đơn hàng."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAllOrders();
    return () => { active = false; };
  }, [requestVersion, search]);

  const rentalCount = orders.filter((order) => order.orderType === "TRAY_RENTAL").length;
  const seedCount = orders.filter((order) => order.orderType === "SEED_PACKET").length;
  const filteredOrders = useMemo(() => orders.filter((order) => tab === "rentals"
    ? order.orderType === "TRAY_RENTAL"
    : order.orderType === "SEED_PACKET"), [orders, tab]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / displayPageSize));
  const visibleOrders = filteredOrders.slice((page - 1) * displayPageSize, page * displayPageSize);
  const emptyMeta = tab === "rentals"
    ? { title: "Chưa có đơn thuê khay", description: "Các đơn thuê khay sẽ xuất hiện tại đây sau khi bạn đặt thuê.", href: "/rent-tray", action: "Thuê khay ngay", icon: Sprout }
    : { title: "Chưa có đơn mua hạt giống", description: "Các đơn mua gói hạt giống sẽ xuất hiện tại đây.", href: "/seeds", action: "Xem hạt giống", icon: ShoppingBag };

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setRequestVersion((value) => value + 1);
  }

  function selectTab(nextTab: OrderTab) {
    setTab(nextTab);
    setPage(1);
  }

  const EmptyIcon = emptyMeta.icon;
  return <main className="mx-auto max-w-7xl px-6 py-10">
    <PageHeader title="Đơn hàng của tôi" subtitle="Theo dõi đơn thuê khay và đơn mua hạt giống tại cùng một nơi." />
    <div role="tablist" aria-label="Loại đơn hàng" className="mb-6 inline-flex rounded-xl bg-[#f3f8f4] p-1">
      <button type="button" role="tab" aria-selected={tab === "rentals"} onClick={() => selectTab("rentals")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${tab === "rentals" ? "bg-white text-[#3F7655] shadow-sm" : "text-[#6b7280] hover:text-[#3F7655]"}`}><Sprout size={17} />Thuê khay <span className="tabular-nums text-xs">{rentalCount}</span></button>
      <button type="button" role="tab" aria-selected={tab === "seeds"} onClick={() => selectTab("seeds")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${tab === "seeds" ? "bg-white text-[#3F7655] shadow-sm" : "text-[#6b7280] hover:text-[#3F7655]"}`}><ShoppingBag size={17} />Hạt giống <span className="tabular-nums text-xs">{seedCount}</span></button>
    </div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8f3eb] bg-white px-4 py-3 text-sm">
      <span className="text-[#6b7280]">Bạn muốn hoàn tất các sản phẩm chưa đặt?</span>
      <Link href={tab === "rentals" ? "/rentals/cart" : "/cart"} className="inline-flex items-center gap-2 font-semibold text-[#4F8F68] hover:text-[#3F7655]"><ShoppingCart size={16} />{tab === "rentals" ? "Mở giỏ thuê khay" : "Mở giỏ hạt giống"}</Link>
    </div>
    <form onSubmit={submitSearch} className="mb-6 flex max-w-lg gap-2"><label className="relative min-w-0 flex-1"><span className="sr-only">Tìm đơn hàng</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo mã đơn hàng..." className="h-11 w-full rounded-xl border border-[#e8f3eb] pl-10 pr-3 text-sm outline-none focus:border-[#4F8F68]" /></label><button className="rounded-xl border border-[#e8f3eb] px-4 text-sm font-semibold text-[#4F8F68] hover:bg-[#f3f8f4]">Tìm</button></form>
    {error ? <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-[#EF5350]">{error}</div> : loading ? <div className="rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải đơn hàng...</div> : visibleOrders.length === 0 ? <div className="rounded-2xl border border-[#e8f3eb] py-20 text-center"><EmptyIcon size={38} className="mx-auto text-[#4F8F68]" /><h2 className="mt-4 text-lg font-bold">{emptyMeta.title}</h2><p className="mt-2 text-sm text-[#6b7280]">{emptyMeta.description}</p><Link href={emptyMeta.href} className="mt-5 inline-flex rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white">{emptyMeta.action}</Link></div> : <div className="space-y-4">{visibleOrders.map((order) => <article key={order.orderId} className="rounded-2xl border border-[#e8f3eb] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center gap-3"><span className="rounded-lg bg-[#f3f8f4] px-3 py-1.5 font-mono text-xs font-semibold">{order.orderCode ?? `#${order.orderId}`}</span><span className="rounded-lg border px-2 py-1 text-xs">{orderTypeLabel(order.orderType)}</span><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</StatusBadge><span className="text-xs text-[#9ca3af]">{formatCustomerDateTime(order.createdAt)}</span><strong className="ml-auto text-lg text-[#4F8F68]">{formatVnd(order.totalAmount)}</strong></div><div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#e8f3eb] pt-4 text-sm text-[#6b7280]"><span>Hạn thanh toán: {formatCustomerDateTime(order.paymentDueAt)}</span>{order.orderType === "TRAY_RENTAL" && <><span>{order.rentals?.length ?? 0} khay</span><span>Ngày gieo: {formatCustomerDate(order.targetPlantingDate)}</span>{order.rentals?.[0] && <span>Đợt trồng: {order.rentals[0].currentCycle}/{order.rentals[0].totalCycles}</span>}</>}<div className="ml-auto flex flex-wrap items-center gap-3">{isPayableOrder(order) && <Link href={`/payment/${order.orderId}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F8F68] px-4 py-2 font-semibold text-white hover:bg-[#3F7655]"><CreditCard size={15} />Thanh toán ngay</Link>}<Link href={`/orders/${order.orderId}`} className="inline-flex items-center gap-1 font-semibold text-[#4F8F68]">Xem chi tiết <ArrowRight size={14} /></Link></div></div></article>)}</div>}
    {!error && !loading && totalPages > 1 && <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Phân trang đơn hàng"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-[#6b7280]">Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau</button></nav>}
  </main>;
}
