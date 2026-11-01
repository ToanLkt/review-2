"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ReceiptText, XCircle } from "lucide-react";

import { getAuthErrorMessage, hasPaymentException, normalizePaymentStatus, paymentExceptionLabel, paymentService, type PaymentHistoryItem, type PaymentStatus } from "@/lib/api";
import { formatCustomerDateTime, formatVnd } from "@/lib/user-format";

const pageSize = 10;

function dateTime(value: string | null) {
  return value ? formatCustomerDateTime(value) : "Chưa thanh toán";
}

function PaymentBadge({ status }: { status: PaymentStatus | null }) {
  const normalized = normalizePaymentStatus(status);
  const meta = normalized === "SUCCESS"
    ? { icon: CheckCircle2, label: "Thành công", className: "bg-green-50 text-green-700" }
    : normalized === "FAILED"
      ? { icon: XCircle, label: "Thất bại", className: "bg-red-50 text-red-700" }
      : normalized === "EXPIRED"
        ? { icon: AlertTriangle, label: "Đã hết hạn", className: "bg-slate-100 text-slate-700" }
        : { icon: Clock3, label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700" };
  const Icon = meta.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.className}`}><Icon size={13} />{meta.label}</span>;
}

export function PaymentHistoryPage() {
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void paymentService.getPaymentHistory(page, pageSize).then((result) => {
      if (!active) return;
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    }).catch((requestError) => {
      if (active) setError(getAuthErrorMessage(requestError, "Không thể tải lịch sử thanh toán."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page]);

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  return <main className="mx-auto max-w-5xl px-6 py-10">
    <Link href="/profile" className="text-sm font-semibold text-[#4F8F68]">← Hồ sơ</Link>
    <div className="mt-7"><p className="text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">Tài khoản</p><h1 className="mt-2 text-3xl font-bold">Lịch sử thanh toán</h1><p className="mt-2 text-sm text-[#6b7280]">Theo dõi các giao dịch gắn với đơn hàng của bạn.</p></div>
    {error ? <div role="alert" className="mt-8 rounded-2xl bg-red-50 p-6 text-sm text-[#EF5350]">{error}</div>
      : loading ? <div className="mt-8 rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải lịch sử thanh toán...</div>
        : items.length === 0 ? <div className="mt-8 rounded-2xl border border-[#e8f3eb] bg-white px-6 py-16 text-center"><ReceiptText size={42} className="mx-auto text-[#4F8F68]" /><h2 className="mt-5 text-xl font-bold">Chưa có giao dịch</h2><p className="mt-2 text-sm text-[#6b7280]">Các giao dịch thanh toán sẽ xuất hiện tại đây sau khi bạn tạo thanh toán cho đơn hàng.</p><Link href="/orders" className="mt-6 inline-flex rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white">Xem đơn hàng</Link></div>
          : <div className="mt-8 overflow-hidden rounded-2xl border border-[#e8f3eb] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#f3f8f4] text-xs text-[#6b7280]"><tr><th className="p-4">Đơn hàng</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Cần thanh toán</th><th className="p-4 text-right">Đã ghi nhận</th><th className="p-4">Thời gian</th></tr></thead><tbody>{items.map((item) => <tr key={item.paymentId} className="border-t border-[#e8f3eb]"><td className="p-4"><Link href={`/orders/${item.orderId}`} className="font-mono font-semibold text-[#3F7655]">{item.orderCode || `#${item.orderId}`}</Link><p className="mt-1 text-xs text-[#9ca3af]">Giao dịch #{item.paymentId}</p></td><td className="p-4"><PaymentBadge status={item.paymentStatus} />{hasPaymentException(item.exceptionType) && <p className="mt-2 max-w-56 text-xs leading-5 text-amber-700">{paymentExceptionLabel(item.exceptionType)}</p>}</td><td className="p-4 text-right font-semibold tabular-nums">{formatVnd(item.expectedAmount)}</td><td className="p-4 text-right font-semibold tabular-nums">{formatVnd(item.amountPaid)}</td><td className="p-4 text-[#6b7280]">{dateTime(item.paidAt)}</td></tr>)}</tbody></table></div></div>}
    {!error && !loading && totalPages > 1 && <nav aria-label="Phân trang lịch sử thanh toán" className="mt-7 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm disabled:opacity-40"><ChevronLeft size={15} />Trước</button><span className="text-sm text-[#6b7280]">Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau<ChevronRight size={15} /></button></nav>}
  </main>;
}
