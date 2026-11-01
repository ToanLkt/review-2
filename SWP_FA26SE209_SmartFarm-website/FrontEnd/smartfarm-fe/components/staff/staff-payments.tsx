"use client";

import { TableSkeleton } from "@/components/ui/loading-state";

import { useEffect, useState, type FormEvent } from "react";
import { Banknote, CircleAlert, CircleCheck, FilePenLine, RefreshCw, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LocalDatePicker } from "@/components/ui/local-date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { dayKey, money, stamp } from "@/lib/formatters";
import { staffPaymentsService } from "@/lib/api/staff/staff-payments-instance";
import type {
  PagedPaymentExceptions,
  PaymentException,
  PaymentReport,
  PaymentReportQuery,
} from "@/lib/api/staff/staff-payments-service";

const emptyPage: PagedPaymentExceptions = {
  items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
};
const emptyReport: PaymentReport = {
  totalTransactions: 0, totalReceived: 0, successful: 0, exceptions: 0, exceptionsByType: {},
};

const exceptionLabels: Record<string, string> = {
  UNDERPAID: "Thiếu tiền",
  OVERPAID: "Thừa tiền",
  LATE: "Thanh toán trễ",
  REFERENCE_MISMATCH: "Sai nội dung",
  ORDER_STATE_MISMATCH: "Sai trạng thái đơn",
  UNMATCHED: "Không khớp đơn",
};

const exceptionLabel = (value: string) => exceptionLabels[value] ?? value;

export function StaffPayments() {
  const today = dayKey(new Date());
  const [exceptions, setExceptions] = useState(emptyPage);
  const [report, setReport] = useState(emptyReport);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [range, setRange] = useState<PaymentReportQuery>({});
  const [rangeError, setRangeError] = useState("");
  const [selected, setSelected] = useState<PaymentException | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    Promise.all([
      staffPaymentsService.exceptions({ page, pageSize: 20 }),
      staffPaymentsService.report(range),
    ])
      .then(([nextExceptions, nextReport]) => {
        if (!cancelled) {
          setExceptions(nextExceptions);
          setReport(nextReport);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu thanh toán.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, range, reloadKey]);

  const applyRange = (event: FormEvent) => {
    event.preventDefault();
    if ((from && from > today) || (to && to > today)) {
      setRangeError("Ngày được chọn không được sau hôm nay.");
      return;
    }
    if (from && to && from > to) {
      setRangeError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
      return;
    }
    setRangeError("");
    setRange({
      from: from ? `${from}T00:00:00+07:00` : undefined,
      to: to ? `${to}T23:59:59.999+07:00` : undefined,
    });
  };

  const abnormalBreakdown = Object.entries(report.exceptionsByType).filter(
    ([type, count]) => type.toUpperCase() !== "NONE" && count > 0,
  );

  const openNote = (item: PaymentException) => {
    setSelected(item);
    setNote(item.staffNote ?? "");
  };

  const saveNote = async () => {
    const normalized = note.trim();
    if (!selected || !normalized) {
      toast.error("Ghi chú xử lý không được để trống.");
      return;
    }
    setSavingNote(true);
    try {
      const updated = await staffPaymentsService.updateNote(selected.eventId, normalized);
      setExceptions((current) => ({
        ...current,
        items: current.items.map((item) => item.eventId === updated.eventId ? updated : item),
      }));
      setSelected(null);
      toast.success("Đã lưu ghi chú xử lý giao dịch.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể lưu ghi chú.");
    } finally {
      setSavingNote(false);
    }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kinh doanh / Thanh toán</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Đối soát thanh toán</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi giao dịch SePay bất thường, ghi chú xử lý và xem báo cáo.</p></div>
      <Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button>
    </header>

    <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E1ECE4] bg-white p-4 shadow-sm">
      <div className="space-y-1 text-xs font-medium text-muted-foreground"><span>Từ ngày</span><LocalDatePicker label="Từ ngày" value={from} onChange={(value) => { setFrom(value); setRangeError(""); }} max={to || today} className="flex w-[180px]" allowClear /></div>
      <div className="space-y-1 text-xs font-medium text-muted-foreground"><span>Đến ngày</span><LocalDatePicker label="Đến ngày" value={to} onChange={(value) => { setTo(value); setRangeError(""); }} min={from || undefined} max={today} className="flex w-[180px]" allowClear /></div>
      <Button type="submit">Xem báo cáo</Button>
      {(from || to) && <Button type="button" variant="ghost" onClick={() => { setFrom(""); setTo(""); setRangeError(""); setRange({}); }}>Xóa khoảng ngày</Button>}
      {rangeError && <p role="alert" className="w-full text-sm text-destructive">{rangeError}</p>}
    </form>

    <section aria-label="Báo cáo thanh toán" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ReportCard icon={ReceiptText} label="Tổng giao dịch" value={report.totalTransactions.toLocaleString("vi-VN")} tone="bg-slate-50 text-slate-700" />
      <ReportCard icon={Banknote} label="Tổng tiền nhận" value={money(report.totalReceived)} tone="bg-emerald-50 text-emerald-700" />
      <ReportCard icon={CircleCheck} label="Thành công" value={report.successful.toLocaleString("vi-VN")} tone="bg-sky-50 text-sky-700" />
      <ReportCard icon={CircleAlert} label="Bất thường" value={report.exceptions.toLocaleString("vi-VN")} tone="bg-amber-50 text-amber-700" />
    </section>

    {abnormalBreakdown.length > 0 && <Card className="section-card"><CardContent className="p-5"><h2 className="text-base font-bold text-[#173B29]">Phân loại giao dịch bất thường</h2><div className="mt-4 flex flex-wrap gap-2">{abnormalBreakdown.map(([type, count]) => <Badge key={type} variant="outline" className="gap-2 border-amber-200 bg-amber-50 px-3 py-1 text-amber-800"><span>{exceptionLabel(type)}</span><strong>{count}</strong></Badge>)}</div></CardContent></Card>}

    <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
      <div className="p-5 sm:p-6"><h2 className="text-lg font-bold text-[#173B29]">Giao dịch cần xử lý</h2><p className="mt-1 text-xs text-muted-foreground">{exceptions.totalItems} giao dịch bất thường trong toàn bộ thời gian · Trang {exceptions.page || page}</p></div>
      {error ? <div className="border-t border-red-100 bg-red-50 px-5 py-10 text-center"><p className="font-semibold text-red-700">Không thể tải thanh toán</p><p className="mt-1 text-sm text-red-600">{error}</p><Button className="mt-4" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></div>
      : loading ? <TableSkeleton rows={6} columns={6} className="border-t" />
      : exceptions.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Giao dịch</th><th className="px-5 py-4">Đơn / Thanh toán</th><th className="px-5 py-4">Số tiền</th><th className="px-5 py-4">Loại lỗi</th><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Ghi chú xử lý</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead>
        <tbody>{exceptions.items.map((item) => <tr key={item.eventId} className="border-t border-[#EDF2EE] align-top hover:bg-[#F8FBF9]">
          <td className="px-5 py-4 font-semibold text-primary">{item.paymentCode || item.referenceCode || "Chưa có mã giao dịch"}</td>
          <td className="px-5 py-4"><p>Đơn: {item.orderId ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">Thanh toán: {item.paymentId ?? "—"}</p></td>
          <td className="px-5 py-4 font-semibold tabular-nums">{money(item.amount)}</td>
          <td className="px-5 py-4"><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{exceptionLabel(item.exceptionType)}</Badge></td>
          <td className="px-5 py-4 whitespace-nowrap">{stamp(item.transactionAt)}</td>
          <td className="max-w-[300px] px-5 py-4"><p className="line-clamp-2 text-xs">{item.staffNote || "Chưa có ghi chú"}</p>{item.reviewedAt && <p className="mt-1 text-[11px] text-muted-foreground">Đã cập nhật {stamp(item.reviewedAt)}</p>}</td>
          <td className="px-5 py-4 text-right"><Button size="sm" variant="outline" onClick={() => openNote(item)}><FilePenLine />{item.staffNote ? "Sửa ghi chú" : "Ghi chú"}</Button></td>
        </tr>)}</tbody>
      </table></div>
      : <div className="border-t px-5 py-16 text-center"><CircleCheck className="mx-auto size-10 text-emerald-600" /><h3 className="mt-3 font-semibold">Không có giao dịch bất thường</h3><p className="mt-1 text-sm text-muted-foreground">Hiện không có giao dịch cần xử lý.</p></div>}

      {!error && exceptions.totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EE] px-5 py-4"><Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trang trước</Button><span className="text-sm text-muted-foreground">{page} / {exceptions.totalPages}</span><Button size="sm" variant="outline" disabled={loading || page >= exceptions.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div>}
    </section>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !savingNote) setSelected(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ghi chú xử lý giao dịch</DialogTitle><DialogDescription>{selected?.paymentCode || selected?.referenceCode || "Giao dịch đã chọn"} · {selected ? exceptionLabel(selected.exceptionType) : ""}. Ghi chú sẽ được lưu cùng giao dịch thanh toán liên quan.</DialogDescription></DialogHeader>
        <div><Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={5} placeholder="Nhập kết quả kiểm tra hoặc hướng xử lý..." /><p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/1000</p></div>
        <DialogFooter><Button variant="outline" onClick={() => setSelected(null)} disabled={savingNote}>Hủy</Button><Button onClick={() => void saveNote()} disabled={savingNote || !note.trim()}>{savingNote ? "Đang lưu..." : "Lưu ghi chú"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function ReportCard({ icon: Icon, label, value, tone }: { icon: typeof ReceiptText; label: string; value: string; tone: string }) {
  return <Card className="rounded-2xl border-[#E1ECE4] shadow-sm"><CardContent className="p-5"><span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span><p className="mt-4 text-2xl font-bold tabular-nums text-[#173B29]">{value}</p><p className="mt-1 text-sm font-medium text-[#436553]">{label}</p></CardContent></Card>;
}
