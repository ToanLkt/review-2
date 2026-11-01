"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { SystemAlert } from "@/lib/api/staff/staff-iot-service";
import { dateTime } from "@/lib/formatters";

type Filter = "all" | "unresolved" | "resolved";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filter, setFilter] = useState<Filter>("unresolved");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const first = await staffIoTService.alerts({ page: 1, pageSize: 100 });
      const pages = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => staffIoTService.alerts({ page: index + 2, pageSize: 100 })));
      setAlerts([first, ...pages].flatMap((page) => page.items));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải cảnh báo."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const id = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(id); }, [load]);

  const visible = useMemo(() => alerts.filter((alert) => {
    if (filter === "unresolved" && alert.isResolved) return false;
    if (filter === "resolved" && !alert.isResolved) return false;
    return `${alert.message} ${alert.alertType} ${alert.deviceId ?? ""}`.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN"));
  }), [alerts, filter, search]);

  async function toggle(alert: SystemAlert) {
    setUpdating(alert.alertId);
    try {
      const updated = await staffIoTService.resolveAlert(alert.alertId, !alert.isResolved);
      setAlerts((items) => items.map((item) => item.alertId === alert.alertId ? updated : item));
      toast.success(updated.isResolved ? "Đã giải quyết cảnh báo." : "Đã mở lại cảnh báo.");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật cảnh báo."); }
    finally { setUpdating(null); }
  }

  return <main className="w-full min-w-0 flex-1 bg-[#F7FAF8]">
    <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[28px] font-bold">Cảnh báo</h1><p className="mt-1 text-sm text-muted-foreground">Cảnh báo từ thiết bị IoT và hệ thống.</p></div><Button type="button" variant="outline" onClick={() => { void load(); }} disabled={loading}><RefreshCw className="size-4" />Làm mới</Button></header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Tất cả" value={alerts.length} />
        <Summary label="Chưa giải quyết" value={alerts.filter((item) => !item.isResolved).length} />
        <Summary label="Đã giải quyết" value={alerts.filter((item) => item.isResolved).length} />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex flex-wrap gap-3 border-b p-5"><Input aria-label="Tìm cảnh báo" placeholder="Tìm nội dung, loại cảnh báo hoặc mã thiết bị" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-md" /><select aria-label="Lọc trạng thái" value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-md border px-3 text-sm"><option value="unresolved">Chưa giải quyết</option><option value="resolved">Đã giải quyết</option><option value="all">Tất cả</option></select></div>
        {error ? <div role="alert" className="p-6 text-sm text-red-600">{error}</div> : loading ? <p className="p-6 text-sm text-muted-foreground">Đang tải cảnh báo...</p> : visible.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Không có cảnh báo phù hợp.</p> :
          <div className="divide-y">{visible.map((alert) => <article key={alert.alertId} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#E8F3EB] px-2 py-0.5 text-xs font-medium">{alert.alertType}</span><span className="text-xs text-muted-foreground">{alert.severity}</span><span className="text-xs text-muted-foreground">{alert.isResolved ? "Đã giải quyết" : "Chưa giải quyết"}</span></div><p className="mt-2 text-sm font-medium">{alert.message}</p><p className="mt-1 text-xs text-muted-foreground">{dateTime(alert.createdAt)}{alert.deviceId != null ? ` · Thiết bị #${alert.deviceId}` : ""}</p></div>
            <Button type="button" variant="outline" disabled={updating === alert.alertId} onClick={() => { void toggle(alert); }}>{updating === alert.alertId ? "Đang cập nhật..." : alert.isResolved ? "Mở lại" : "Đánh dấu đã giải quyết"}</Button>
          </article>)}</div>}
      </section>
    </div>
  </main>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value.toLocaleString("vi-VN")}</p></div>;
}
