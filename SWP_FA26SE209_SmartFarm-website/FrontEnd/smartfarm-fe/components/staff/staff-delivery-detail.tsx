"use client";

import { DetailSkeleton } from "@/components/ui/loading-state";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, PackageCheck, RefreshCw, Truck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { StaffReferenceSelect } from "./staff-reference-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { stamp } from "@/lib/formatters";
import { staffDeliveriesService } from "@/lib/api/staff/staff-deliveries-instance";
import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
  type StaffDelivery,
} from "@/lib/api/staff/staff-deliveries-service";
import {
  deliveryStatusClass,
  deliveryStatusLabel,
  nextDeliveryStatus,
} from "./staff-delivery-display";

export function StaffDeliveryDetail({ id, basePath = "/staff/deliveries" }: { id: string; basePath?: string }) {
  const deliveryId = Number(id);
  const validId = Number.isInteger(deliveryId) && deliveryId > 0;
  const [delivery, setDelivery] = useState<StaffDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [shipperId, setShipperId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [targetStatus, setTargetStatus] = useState<DeliveryStatus>("PENDING");
  const [trackingCode, setTrackingCode] = useState("");
  const [actualWeightKg, setActualWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const applyDelivery = (item: StaffDelivery) => {
    setDelivery(item);
    setShipperId(item.shipperId ? String(item.shipperId) : "");
    setTargetStatus(DELIVERY_STATUSES.includes(item.status as DeliveryStatus) ? item.status as DeliveryStatus : "PENDING");
    setTrackingCode(item.trackingCode ?? "");
    setActualWeightKg(item.actualWeightKg === null ? "" : String(item.actualWeightKg));
    setNotes(item.notes ?? "");
  };

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    staffDeliveriesService.get(deliveryId)
      .then((item) => { if (!cancelled) applyDelivery(item); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải chi tiết giao hàng.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [deliveryId, reloadKey, validId]);

  const assign = async (event: FormEvent) => {
    event.preventDefault();
    const staffId = Number(shipperId);
    if (!Number.isInteger(staffId) || staffId <= 0) {
      toast.error("Vui lòng chọn nhân viên giao hàng.");
      return;
    }
    setAssigning(true);
    try {
      applyDelivery(await staffDeliveriesService.assignShipper(deliveryId, staffId));
      toast.success("Đã gán shipper cho delivery.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể gán shipper.");
    } finally {
      setAssigning(false);
    }
  };

  const update = async (event: FormEvent) => {
    event.preventDefault();
    const weight = actualWeightKg ? Number(actualWeightKg) : null;
    if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 10000)) {
      toast.error("Trọng lượng phải lớn hơn 0 và không vượt quá 10.000 kg.");
      return;
    }
    setUpdating(true);
    try {
      applyDelivery(await staffDeliveriesService.update(deliveryId, {
        status: targetStatus,
        trackingCode,
        actualWeightKg: weight,
        notes,
      }));
      toast.success("Đã cập nhật thông tin giao hàng.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật giao hàng.");
    } finally {
      setUpdating(false);
    }
  };

  if (!validId) return <StatePage text="Mã delivery không hợp lệ." basePath={basePath} />;
  if (loading) return <DetailSkeleton />;
  if (error || !delivery) return <StatePage text={error || "Không tìm thấy delivery."} basePath={basePath} retry={() => setReloadKey((value) => value + 1)} />;

  const current = DELIVERY_STATUSES.includes(delivery.status as DeliveryStatus)
    ? delivery.status as DeliveryStatus
    : undefined;
  const next = current ? nextDeliveryStatus[current] : undefined;
  const ended = current === "DELIVERED" || current === "FAILED";
  const statusOptions = current
    ? [current, ...(next ? [next] : []), ...(!ended ? ["FAILED" as const] : [])]
    : DELIVERY_STATUSES;
  const uniqueStatusOptions = [...new Set(statusOptions)];

  const rows = [
    ["Đơn hàng", delivery.orderCode],
    ["Loại giao hàng", delivery.rentalId ? "Đơn thuê khay" : "Đơn mua hàng"],
    ["Người nhận", delivery.recipientName],
    ["Số điện thoại", delivery.recipientPhone],
    ["Địa chỉ", delivery.shippingAddress],
    ["Lịch giao", delivery.scheduledDeliveryAt ? stamp(delivery.scheduledDeliveryAt) : "Chưa hẹn"],
    ["Shipper", delivery.shipperName || (delivery.shipperId ? "Đã gán nhân viên" : "Chưa gán")],
    ["Đã xuất phát", delivery.shippedAt ? stamp(delivery.shippedAt) : "—"],
    ["Đã giao", delivery.deliveredAt ? stamp(delivery.deliveredAt) : "—"],
  ];

  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]">
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 -ml-3"><Link href={basePath}><ArrowLeft />Quay lại danh sách</Link></Button>
      <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kinh doanh / Giao hàng</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Giao hàng {delivery.orderCode}</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi người nhận, shipper và tiến độ giao đơn {delivery.orderCode}.</p></div><Badge variant="outline" className={deliveryStatusClass(delivery.status)}>{deliveryStatusLabel(delivery.status)}</Badge></header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="section-card"><CardContent className="p-5 sm:p-6"><h2 className="text-lg font-bold text-[#173B29]">Thông tin giao hàng</h2><dl className="mt-4 divide-y divide-[#EDF2EE]">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[65%] text-right font-medium">{value}</dd></div>)}</dl></CardContent></Card>

        <div className="space-y-5">
    <Card className="section-card"><CardContent className="p-5 sm:p-6"><div className="flex items-center gap-2"><UserRound className="size-5 text-primary" /><h2 className="text-lg font-bold text-[#173B29]">Gán shipper</h2></div>{ended ? <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Delivery đã kết thúc nên không thể gán lại shipper.</p> : <form onSubmit={assign} className="mt-4 flex gap-2"><div className="min-w-0 flex-1"><StaffReferenceSelect kind="staff" label="Nhân viên giao hàng" value={shipperId} onChange={setShipperId} /></div><Button type="submit" disabled={assigning || !shipperId}>{assigning ? "Đang gán..." : "Gán"}</Button></form>}</CardContent></Card>

          <Card className="section-card"><CardContent className="p-5 sm:p-6"><div className="flex items-center gap-2"><Truck className="size-5 text-primary" /><h2 className="text-lg font-bold text-[#173B29]">Cập nhật delivery</h2></div><form onSubmit={update} className="mt-4 space-y-4">
            <label className="block space-y-1.5 text-sm font-medium"><span>Trạng thái</span><Select value={targetStatus} onValueChange={(value) => setTargetStatus(value as DeliveryStatus)} disabled={ended}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{uniqueStatusOptions.map((value) => <SelectItem key={value} value={value}>{deliveryStatusLabel(value)}</SelectItem>)}</SelectContent></Select></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>Mã vận đơn</span><Input maxLength={100} value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="Ví dụ: GHN-123456" /></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>Trọng lượng thực tế (kg)</span><Input type="number" min="0.01" max="10000" step="0.01" value={actualWeightKg} onChange={(event) => setActualWeightKg(event.target.value)} /></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>Ghi chú</span><Textarea maxLength={1000} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <Button type="submit" className="w-full" disabled={updating}>{updating ? "Đang cập nhật..." : "Lưu cập nhật"}</Button>
            {!ended && <p className="text-xs leading-5 text-muted-foreground">Chỉ được chuyển sang bước kế tiếp hoặc đánh dấu giao thất bại. Khi bắt đầu giao, đơn hàng và tồn kho sẽ được cập nhật.</p>}
          </form></CardContent></Card>
        </div>
      </div>
    </div>
  </main>;
}

function StatePage({ text, basePath, retry }: { text: string; basePath: string; retry?: () => void }) {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] px-4 py-12 text-center"><PackageCheck className="mx-auto size-10 text-[#8BAF9A]" /><h1 className="mt-4 text-xl font-bold">{text}</h1><div className="mt-5 flex justify-center gap-2">{retry && <Button variant="outline" onClick={retry}><RefreshCw />Thử lại</Button>}<Button asChild variant="outline"><Link href={basePath}>Quay lại danh sách</Link></Button></div></main>;
}
