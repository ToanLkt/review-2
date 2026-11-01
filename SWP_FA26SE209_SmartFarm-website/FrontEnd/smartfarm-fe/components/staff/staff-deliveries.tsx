"use client";

import { TableSkeleton } from "@/components/ui/loading-state";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, PackageCheck, Plus, RefreshCw, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { StaffReferenceSelect } from "./staff-reference-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { stamp } from "@/lib/formatters";
import { staffDeliveriesService } from "@/lib/api/staff/staff-deliveries-instance";
import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
  type PagedStaffDeliveries,
} from "@/lib/api/staff/staff-deliveries-service";
import { deliveryStatusClass, deliveryStatusLabel } from "./staff-delivery-display";

const emptyPage: PagedStaffDeliveries = {
  items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0,
};
const emptyCreateForm = {
  orderId: "", rentalId: "", recipientName: "", recipientPhone: "", shippingAddress: "", notes: "",
};

export function StaffDeliveries({ basePath = "/staff/deliveries" }: { basePath?: string }) {
  const router = useRouter();
  const [result, setResult] = useState(emptyPage);
  const [queryInput, setQueryInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState(emptyCreateForm);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    staffDeliveriesService.list({
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      page,
      pageSize: 20,
    })
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách giao hàng.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, reloadKey, search, status]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(queryInput.trim());
  };

  const createDelivery = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError("");
    const orderId = Number(form.orderId);
    const rentalId = form.rentalId ? Number(form.rentalId) : null;
    if (!Number.isInteger(orderId) || orderId <= 0 || (rentalId !== null && (!Number.isInteger(rentalId) || rentalId <= 0))) {
      setCreateError("Vui lòng nhập mã đơn hàng hợp lệ.");
      return;
    }
    if (!form.recipientName.trim() || !form.recipientPhone.trim() || !form.shippingAddress.trim()) {
      setCreateError("Vui lòng nhập đủ người nhận, số điện thoại và địa chỉ.");
      return;
    }
    setCreating(true);
    try {
      const created = await staffDeliveriesService.create({
        orderId,
        rentalId,
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        notes: form.notes.trim() || null,
      });
      setCreateOpen(false);
      setForm(emptyCreateForm);
      toast.success("Đã tạo thông tin giao hàng.");
      router.push(`${basePath}/${created.deliveryId}`);
    } catch (reason) {
      setCreateError(reason instanceof Error ? reason.message : "Không thể tạo giao hàng.");
    } finally {
      setCreating(false);
    }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kinh doanh / Giao hàng</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Quản lý giao hàng</h1><p className="mt-2 text-sm text-muted-foreground">Tạo thông tin giao hàng cho đơn đã xác nhận và theo dõi tiến độ giao.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button><Button onClick={() => { setCreateError(""); setCreateOpen(true); }}><Plus />Tạo giao hàng</Button></div>
    </header>

    <section aria-label="Tổng quan giao hàng" className="grid gap-4 sm:grid-cols-3">
      <Summary icon={Truck} label="Tổng delivery phù hợp" value={result.totalItems} tone="bg-sky-50 text-sky-700" />
      <Summary icon={PackageCheck} label="Chờ đóng gói trên trang" value={result.items.filter((item) => item.status === "PENDING").length} tone="bg-amber-50 text-amber-700" />
      <Summary icon={Truck} label="Đang giao trên trang" value={result.items.filter((item) => item.status === "SHIPPING").length} tone="bg-emerald-50 text-emerald-700" />
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
      <div className="flex flex-wrap gap-3 p-5 sm:p-6">
        <form onSubmit={submitSearch} className="flex min-w-[280px] flex-1 gap-2"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8BAF9A]" /><Input aria-label="Tìm giao hàng" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Mã đơn hoặc mã vận đơn..." className="pl-9" /></label><Button type="submit" variant="outline">Tìm</Button></form>
        <Select value={status} onValueChange={(value) => { setStatus(value as DeliveryStatus | "ALL"); setPage(1); }}><SelectTrigger className="w-[190px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem>{DELIVERY_STATUSES.map((value) => <SelectItem key={value} value={value}>{deliveryStatusLabel(value)}</SelectItem>)}</SelectContent></Select>
      </div>

      {error ? <div className="border-t border-red-100 bg-red-50 px-5 py-10 text-center"><p className="font-semibold text-red-700">Không thể tải giao hàng</p><p className="mt-1 text-sm text-red-600">{error}</p><Button className="mt-4" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></div>
      : loading ? <TableSkeleton rows={6} columns={6} className="border-t" />
      : result.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Delivery</th><th className="px-5 py-4">Người nhận</th><th className="px-5 py-4">Địa chỉ</th><th className="px-5 py-4">Shipper</th><th className="px-5 py-4">Mã vận đơn</th><th className="px-5 py-4">Lịch giao</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Chi tiết</th></tr></thead>
        <tbody>{result.items.map((item) => <tr key={item.deliveryId} className="border-t border-[#EDF2EE] hover:bg-[#F8FBF9]">
          <td className="px-5 py-4 font-semibold text-primary">{item.orderCode}</td>
          <td className="px-5 py-4"><p className="font-medium">{item.recipientName}</p><p className="mt-1 text-xs text-muted-foreground">{item.recipientPhone}</p></td>
          <td className="max-w-[260px] px-5 py-4 text-xs">{item.shippingAddress}</td>
          <td className="px-5 py-4">{item.shipperName || "Chưa gán"}</td>
          <td className="px-5 py-4">{item.trackingCode || "—"}</td>
          <td className="px-5 py-4 whitespace-nowrap">{item.scheduledDeliveryAt ? stamp(item.scheduledDeliveryAt) : "Chưa hẹn"}</td>
          <td className="px-5 py-4"><Badge variant="outline" className={deliveryStatusClass(item.status)}>{deliveryStatusLabel(item.status)}</Badge></td>
          <td className="px-5 py-4 text-right"><Link href={`${basePath}/${item.deliveryId}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Xem <ArrowUpRight className="size-4" /></Link></td>
        </tr>)}</tbody>
      </table></div>
      : <div className="border-t px-5 py-16 text-center"><Truck className="mx-auto size-10 text-[#8BAF9A]" /><h3 className="mt-3 font-semibold">Không có delivery phù hợp</h3><p className="mt-1 text-sm text-muted-foreground">Thử thay đổi mã tìm kiếm hoặc trạng thái.</p></div>}

      {!error && result.totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-[#EDF2EE] px-5 py-4"><Button size="sm" variant="outline" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trang trước</Button><span className="text-sm text-muted-foreground">{page} / {result.totalPages}</span><Button size="sm" variant="outline" disabled={loading || page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</Button></div>}
    </section>

    <Dialog open={createOpen} onOpenChange={(open) => { if (!creating) setCreateOpen(open); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Tạo thông tin giao hàng</DialogTitle><DialogDescription>Chỉ đơn đang ở trạng thái CONFIRMED và chưa có delivery mới tạo được.</DialogDescription></DialogHeader><form onSubmit={createDelivery} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Đơn hàng" required><StaffReferenceSelect kind="confirmedOrder" label="Đơn hàng đã xác nhận" value={form.orderId} onChange={(value) => setForm({ ...form, orderId: value, rentalId: "" })} /></Field><Field label="Khay thuê (nếu có)"><StaffReferenceSelect key={form.orderId} kind="rental" label="Khay thuê trong đơn" value={form.rentalId} orderId={form.orderId} disabled={!form.orderId} optional onChange={(value) => setForm({ ...form, rentalId: value })} /></Field></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Người nhận" required><Input value={form.recipientName} maxLength={100} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} /></Field><Field label="Số điện thoại" required><Input type="tel" value={form.recipientPhone} maxLength={20} onChange={(event) => setForm({ ...form, recipientPhone: event.target.value })} /></Field></div>
      <Field label="Địa chỉ giao hàng" required><Input value={form.shippingAddress} maxLength={500} onChange={(event) => setForm({ ...form, shippingAddress: event.target.value })} /></Field>
      <Field label="Ghi chú"><Textarea value={form.notes} maxLength={1000} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
      {createError && <p role="alert" className="text-sm text-destructive">{createError}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Hủy</Button><Button type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Tạo giao hàng"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </div>;
}

function Summary({ icon: Icon, label, value, tone }: { icon: typeof Truck; label: string; value: number; tone: string }) {
  return <div className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm"><span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span><p className="mt-4 text-3xl font-bold tabular-nums text-[#173B29]">{value}</p><p className="mt-1 text-sm font-medium text-[#436553]">{label}</p></div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium"><span>{label}{required && <span className="text-destructive"> *</span>}</span>{children}</label>;
}
