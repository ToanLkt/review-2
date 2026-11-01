"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Search } from "lucide-react";

import { getAuthErrorMessage, orderStatusLabel, orderStatusTone, rentalService, type RentalOrder } from "@/lib/api";
import { formatCustomerDateTime, formatVnd } from "@/lib/user-format";
import { PageHeader, StatusBadge } from "@/components/user/user-ui";

const pageSize = 10;

function dateTime(value: string) {
  return formatCustomerDateTime(value);
}

export function RentalsPage() {
  const [items, setItems] = useState<RentalOrder[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void rentalService.getRentals({ search, page, pageSize })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .catch((requestError) => {
        if (active) setError(getAuthErrorMessage(requestError, "Không thể tải danh sách đơn thuê."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, requestVersion, search]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPage(1);
    setSearch(searchInput.trim());
    setRequestVersion((value) => value + 1);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  return <div className="mx-auto max-w-7xl px-6 py-10">
    <PageHeader title="Đơn thuê của tôi" subtitle="Theo dõi các đơn thuê khay của bạn." action={<Link href="/rent-tray" className="rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white">+ Tạo đơn thuê</Link>} />
    <form onSubmit={submitSearch} className="mb-6 flex max-w-lg gap-2"><label className="relative min-w-0 flex-1"><span className="sr-only">Tìm đơn thuê</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo mã đơn thuê..." className="h-11 w-full rounded-xl border border-[#e8f3eb] pl-10 pr-3 text-sm outline-none focus:border-[#4F8F68]" /></label><button className="rounded-xl border border-[#e8f3eb] px-4 text-sm font-semibold text-[#4F8F68]">Tìm</button></form>
    {error ? <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-[#EF5350]">{error}</div> : loading ? <div className="rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải đơn thuê...</div> : items.length === 0 ? <div className="rounded-2xl border border-[#e8f3eb] py-20 text-center"><ClipboardList size={38} className="mx-auto text-[#4F8F68]" /><h2 className="mt-4 text-lg font-bold">Chưa có đơn thuê</h2><p className="mt-2 text-sm text-[#6b7280]">Bạn có thể tạo đơn thuê đầu tiên từ danh mục giống cây.</p><Link href="/rent-tray" className="mt-5 inline-flex rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white">Thuê khay ngay</Link></div> : <div className="space-y-4">{items.map((order) => <article key={order.orderId} className="rounded-2xl border border-[#e8f3eb] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center gap-3"><span className="rounded-lg bg-[#f3f8f4] px-3 py-1.5 font-mono text-xs font-semibold">{order.orderCode ?? `#${order.orderId}`}</span><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</StatusBadge><span className="text-xs text-[#9ca3af]">{dateTime(order.createdAt)}</span><strong className="ml-auto text-lg text-[#4F8F68]">{formatVnd(order.totalAmount)}</strong></div><div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#e8f3eb] pt-4 text-sm text-[#6b7280]"><span>{order.rentals?.length ?? 0} khay</span><span>Hạn thanh toán: {dateTime(order.paymentDueAt)}</span><Link href={`/rentals/${order.orderId}`} className="ml-auto inline-flex items-center gap-1 font-semibold text-[#4F8F68]">Xem chi tiết <ArrowRight size={14} /></Link></div></article>)}</div>}
    {!error && !loading && totalPages > 1 && <div className="mt-8 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-[#6b7280]">Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau</button></div>}
  </div>;
}
