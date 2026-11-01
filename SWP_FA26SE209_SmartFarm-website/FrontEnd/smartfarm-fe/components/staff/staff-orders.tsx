"use client";

import { TableSkeleton } from "@/components/ui/loading-state";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, ClipboardList, PackageCheck, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { date, money } from "@/lib/formatters";
import {
  STAFF_ORDER_STATUSES,
  STAFF_ORDER_TYPES,
  type PagedStaffOrders,
  type StaffOrderStatus,
  type StaffOrderType,
} from "@/lib/api/staff/staff-orders-service";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import { orderStatusClass, orderStatusLabel, orderSummary, orderTypeLabel } from "./staff-order-display";

const emptyPage: PagedStaffOrders = {
  items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
};

export function StaffOrders({ basePath = "/staff/orders" }: { basePath?: string }) {
  const [result, setResult] = useState(emptyPage);
  const [queryInput, setQueryInput] = useState("");
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState<StaffOrderType | "ALL">("ALL");
  const [status, setStatus] = useState<StaffOrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    const request = {
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      page,
      pageSize: 20,
    };
    const promise = orderType === "TRAY_RENTAL"
      ? staffOrdersService.listRentals(request)
      : staffOrdersService.list({ ...request, orderType: orderType === "ALL" ? undefined : orderType });

    promise
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách đơn hàng.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderType, page, reloadKey, search, status]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(queryInput.trim());
  };

  return <div className="space-y-6">
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kinh doanh / Đơn hàng</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Đơn hàng</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dữ liệu trực tiếp từ hệ thống, gồm đơn thuê khay và đơn mua hạt giống.</p>
    </header>

    <section aria-label="Tổng quan đơn hàng" className="grid gap-4 sm:grid-cols-3">
      <SummaryCard icon={ClipboardList} value={result.totalItems} label="Tổng đơn phù hợp" className="bg-emerald-50 text-emerald-700" />
      <SummaryCard icon={PackageCheck} value={result.items.filter((order) => order.status === "AWAITING_PAYMENT").length} label="Chờ thanh toán trên trang" className="bg-amber-50 text-amber-700" />
      <SummaryCard icon={ClipboardList} value={result.totalPages} label="Tổng số trang" className="bg-sky-50 text-sky-700" />
    </section>

    <section aria-label="Danh sách đơn hàng" className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold text-[#173B29]">Danh sách đơn hàng</h2><p className="mt-1 text-xs text-muted-foreground">Trang {result.page || page} · {result.totalItems} đơn phù hợp</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <form onSubmit={submitSearch} className="flex min-w-[260px] flex-1 gap-2">
            <label className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8BAF9A]" /><Input aria-label="Tìm đơn hàng" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Tìm theo mã đơn..." className="h-10 border-[#DCEBE1] bg-[#FBFDFC] pl-9" /></label>
            <Button type="submit" variant="outline">Tìm</Button>
          </form>
          <Select value={orderType} onValueChange={(value) => { setOrderType(value as StaffOrderType | "ALL"); setPage(1); }}>
            <SelectTrigger className="h-10 w-[180px]"><SelectValue placeholder="Loại đơn" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Tất cả loại đơn</SelectItem>{STAFF_ORDER_TYPES.map((value) => <SelectItem key={value} value={value}>{orderTypeLabel(value)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => { setStatus(value as StaffOrderStatus | "ALL"); setPage(1); }}>
            <SelectTrigger className="h-10 w-[190px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem>{STAFF_ORDER_STATUSES.map((value) => <SelectItem key={value} value={value}>{orderStatusLabel(value)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {error ? <div className="border-t border-red-100 bg-red-50 px-5 py-10 text-center"><p className="font-semibold text-red-700">Không thể tải đơn hàng</p><p className="mt-1 text-sm text-red-600">{error}</p><Button className="mt-4" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></div>
      : loading ? <TableSkeleton rows={6} columns={6} className="border-t" />
      : result.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Đơn hàng</th><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Loại đơn</th><th className="px-5 py-4">Nội dung</th><th className="px-5 py-4">Tổng tiền</th><th className="px-5 py-4">Ngày tạo</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Chi tiết</th></tr></thead>
        <tbody>{result.items.map((order) => <tr key={order.orderId} className="border-t border-[#EDF2EE] hover:bg-[#F8FBF9]">
          <td className="px-5 py-4 font-semibold text-primary">{order.orderCode}</td>
          <td className="px-5 py-4 font-medium">{order.customerName || "Khách hàng"}</td>
          <td className="px-5 py-4">{orderTypeLabel(order.orderType)}</td>
          <td className="max-w-[260px] px-5 py-4 text-xs text-muted-foreground">{orderSummary(order)}</td>
          <td className="px-5 py-4 font-semibold tabular-nums">{money(order.totalAmount)}</td>
          <td className="px-5 py-4">{date(order.createdAt)}</td>
          <td className="px-5 py-4"><Badge variant="outline" className={orderStatusClass(order.status)}>{orderStatusLabel(order.status)}</Badge></td>
          <td className="px-5 py-4 text-right"><Link href={`${basePath}/${order.orderId}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Xem đơn <ArrowUpRight className="size-4" /></Link></td>
        </tr>)}</tbody>
      </table></div>
      : <div className="border-t px-5 py-16 text-center"><PackageCheck className="mx-auto size-9 text-[#8BAF9A]" /><h3 className="mt-3 font-semibold">Không có đơn hàng phù hợp</h3><p className="mt-1 text-sm text-muted-foreground">Thử thay đổi mã đơn, loại đơn hoặc trạng thái.</p></div>}

      {!error && result.totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EE] px-5 py-4">
        <Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trang trước</Button>
        <span className="text-sm text-muted-foreground">{page} / {result.totalPages}</span>
        <Button variant="outline" size="sm" disabled={loading || page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button>
      </div>}
    </section>
  </div>;
}

function SummaryCard({ icon: Icon, value, label, className }: { icon: typeof ClipboardList; value: number; label: string; className: string }) {
  return <div className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm"><span className={`flex size-10 items-center justify-center rounded-xl ${className}`}><Icon className="size-5" /></span><p className="mt-4 text-3xl font-bold tabular-nums text-[#173B29]">{value}</p><p className="mt-1 text-sm font-medium text-[#436553]">{label}</p></div>;
}
