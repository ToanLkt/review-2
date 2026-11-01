"use client";

import { TableSkeleton } from "@/components/ui/loading-state";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Boxes, Eye, Layers3, MapPinned, Pencil, Plus, RefreshCw, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import { StaffCyclesPage } from "./staff-cycles-page";
import { StaffTrayFormSheet } from "./staff-tray-form-sheet";
import {
  TRAY_STATUSES,
  type FarmRack,
  type FarmZoneSummary,
  type SoilTray,
  type TrayStatus,
} from "@/lib/api/staff/staff-farm-service";

const statusLabels: Record<TrayStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  RENTED: "Đang được thuê",
  MAINTENANCE: "Bảo trì",
  INACTIVE: "Ngừng hoạt động",
};

const statusClasses: Record<TrayStatus, string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RENTED: "border-sky-200 bg-sky-50 text-sky-700",
  MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
};

function isTrayStatus(value: string): value is TrayStatus {
  return TRAY_STATUSES.some((status) => status === value);
}

export function StaffFarmInfrastructure() {
  const params = useSearchParams();
  const router = useRouter();
  const requestedTab = params.get("tab");
  const tab = requestedTab === "cycles" ? "cycles" : requestedTab === "trays" || (!requestedTab && params.has("q")) ? "trays" : "areas";
  const [zones, setZones] = useState<FarmZoneSummary[]>([]);
  const [racks, setRacks] = useState<FarmRack[]>([]);
  const [trays, setTrays] = useState<SoilTray[]>([]);
  const [zoneFilter, setZoneFilter] = useState(() => params.get("zoneId") || "ALL");
  const [rackFilter, setRackFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<TrayStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editingTray, setEditingTray] = useState<SoilTray | null>(null);
  const [nextStatus, setNextStatus] = useState<TrayStatus>("AVAILABLE");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const zoneId = zoneFilter === "ALL" ? undefined : Number(zoneFilter);
    const rackId = rackFilter === "ALL" ? undefined : Number(rackFilter);
    const status = statusFilter === "ALL" ? undefined : statusFilter;

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });

    Promise.all([staffFarmService.zones(), staffFarmService.racks(zoneId)])
      .then(async ([nextZones, nextRacks]) => {
        let nextTrays: SoilTray[];
        if (rackId) {
          nextTrays = await staffFarmService.trays({ rackId, status });
        } else if (zoneId) {
          const trayGroups = await Promise.all(
            nextRacks.map((rack) => staffFarmService.trays({ rackId: rack.rackId, status })),
          );
          nextTrays = trayGroups.flat();
        } else {
          nextTrays = await staffFarmService.trays({ status });
        }
        return { nextZones, nextRacks, nextTrays };
      })
      .then(({ nextZones, nextRacks, nextTrays }) => {
        if (!cancelled) {
          setZones(nextZones);
          setRacks(nextRacks);
          setTrays(nextTrays);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải hạ tầng trang trại.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [rackFilter, reloadKey, statusFilter, zoneFilter]);

  const zoneNames = useMemo(() => new Map(zones.map((zone) => [zone.zoneId, zone.zoneName])), [zones]);
  const rackById = useMemo(() => new Map(racks.map((rack) => [rack.rackId, rack])), [racks]);
  const search = (params.get("q") || "").trim().toLocaleLowerCase("vi");
  const visibleZones = zones.filter(zone => !search
    || `${zone.zoneName} ${zone.locationDescription || ""}`.toLocaleLowerCase("vi").includes(search)
    || racks.some(rack => rack.zoneId === zone.zoneId && rack.rackCode.toLocaleLowerCase("vi").includes(search))
    || trays.some(tray => rackById.get(tray.rackId)?.zoneId === zone.zoneId && tray.trayCode.toLocaleLowerCase("vi").includes(search)));
  const visibleTrays = trays.filter(tray => !search || `${tray.trayCode} ${rackById.get(tray.rackId)?.rackCode || ""} ${zoneNames.get(rackById.get(tray.rackId)?.zoneId || 0) || ""}`.toLocaleLowerCase("vi").includes(search));

  const openStatusDialog = (tray: SoilTray) => {
    if (!isTrayStatus(tray.currentStatus) || tray.currentStatus === "RENTED") return;
    setEditingTray(tray);
    setNextStatus(tray.currentStatus);
    setSaveError("");
  };

  const updateStatus = async () => {
    if (!editingTray) return;
    setSaving(true);
    setSaveError("");
    try {
      await staffFarmService.updateTrayStatus(editingTray.soilTrayId, nextStatus);
      toast.success(`Đã cập nhật trạng thái khay ${editingTray.trayCode}.`);
      setEditingTray(null);
      setReloadKey((value) => value + 1);
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Không thể cập nhật trạng thái khay.");
    } finally {
      setSaving(false);
    }
  };

  if (tab === "cycles") return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / Hạ tầng</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Khu vực & khay trồng</h1><p className="mt-2 text-sm text-muted-foreground">Quản lý khu vực, khay và chu kỳ trồng trong nông trại.</p></header>
    <Tabs value={tab} onValueChange={(value) => router.replace("/staff/trays?tab=" + value, { scroll: false })}>
      <TabsList variant="line" className="h-11 gap-5 bg-transparent">
        <TabsTrigger value="areas"><MapPinned className="size-4" />Khu vực & tầng kệ</TabsTrigger>
        <TabsTrigger value="trays"><Boxes className="size-4" />Danh sách khay</TabsTrigger>
        <TabsTrigger value="cycles"><Sprout className="size-4" />Chu kỳ trồng</TabsTrigger>
      </TabsList>
    </Tabs>
    <StaffCyclesPage embedded />
  </div>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / Hạ tầng</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Khu vực & khay trồng</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi khu vực, kệ và cập nhật trạng thái khay trong nông trại.</p></div>
      <div className="flex gap-2"><Button onClick={() => setCreateOpen(true)}><Plus />Thêm khay</Button><Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button></div>
    </header>

    <Tabs value={tab} onValueChange={(value) => router.replace("/staff/trays?tab=" + value, { scroll: false })}>
      <TabsList variant="line" className="h-11 gap-5 bg-transparent">
        <TabsTrigger value="areas"><MapPinned className="size-4" />Khu vực & tầng kệ</TabsTrigger>
        <TabsTrigger value="trays"><Boxes className="size-4" />Danh sách khay</TabsTrigger>
        <TabsTrigger value="cycles"><Sprout className="size-4" />Chu kỳ trồng</TabsTrigger>
      </TabsList>
    </Tabs>
    <section aria-label="Tổng quan hạ tầng" className="grid gap-4 sm:grid-cols-3">
      <Summary icon={MapPinned} label="Khu vực" value={zones.length} />
      <Summary icon={Layers3} label="Kệ đang hiển thị" value={racks.length} />
      <Summary icon={Sprout} label="Khay đang hiển thị" value={trays.length} />
    </section>

    <section className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <Select value={zoneFilter} onValueChange={(value) => { setZoneFilter(value); setRackFilter("ALL"); }}><SelectTrigger><SelectValue placeholder="Khu vực" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả khu vực</SelectItem>{zones.map((zone) => <SelectItem key={zone.zoneId} value={String(zone.zoneId)}>{zone.zoneName}</SelectItem>)}</SelectContent></Select>
        <Select value={rackFilter} onValueChange={setRackFilter}><SelectTrigger><SelectValue placeholder="Kệ" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả kệ</SelectItem>{racks.map((rack) => <SelectItem key={rack.rackId} value={String(rack.rackId)}>{rack.rackCode}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TrayStatus | "ALL")}><SelectTrigger><SelectValue placeholder="Trạng thái khay" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem>{TRAY_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select>
      </div>
    </section>

    {tab === "areas" && !error && !loading && zones.length > 0 && <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleZones.map((zone) => <button type="button" key={zone.zoneId} onClick={() => router.push(`/staff/trays/areas/${zone.zoneId}`)} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-primary/40 ${zoneFilter === String(zone.zoneId) ? "border-primary ring-2 ring-primary/10" : "border-[#E1ECE4]"}`}>
        <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><MapPinned className="size-5" /></span><Badge variant="outline" className={zone.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>{zone.isActive ? "Hoạt động" : "Ngừng hoạt động"}</Badge></div>
        <h2 className="mt-4 font-bold text-[#173B29]">{zone.zoneName}</h2><p className="mt-1 min-h-5 text-xs text-muted-foreground">{zone.locationDescription || "Chưa có mô tả vị trí"}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><ZoneMetric label="Kệ" value={zone.rackCount} /><ZoneMetric label="Khay" value={zone.trayCount} /><ZoneMetric label="Sẵn sàng" value={zone.availableTrays} /></div>
        <p className="mt-3 text-[11px] text-muted-foreground">Sức chứa: {zone.trayCount}/{zone.totalCapacity}</p><p className="mt-3 flex items-center gap-1 text-sm text-primary"><Eye className="size-4" />Xem chi tiết khu vực</p>
      </button>)}
    </section>}
    {tab === "areas" && !loading && !error && !zones.length && <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">Chưa có khu vực. Liên hệ quản trị viên để thiết lập hạ tầng.</div>}
    {tab === "areas" && !loading && !error && search && zones.length > 0 && !visibleZones.length && <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">Không tìm thấy khu vực, kệ hoặc khay phù hợp. <Button type="button" variant="link" onClick={() => router.replace("/staff/trays?tab=areas", { scroll: false })}>Xóa tìm kiếm</Button></div>}

    <section hidden={tab !== "trays" && !error && !loading} className="overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-sm">
      <div className="border-b border-[#EDF2EE] px-5 py-4"><h2 className="font-semibold text-[#173B29]">Danh sách khay</h2><p className="mt-1 text-xs text-muted-foreground">Khay đang thuê chỉ được giải phóng qua quy trình thuê.</p></div>
      {error ? <div className="bg-red-50 px-5 py-12 text-center"><p className="font-semibold text-red-700">Không thể tải hạ tầng trang trại</p><p className="mt-1 text-sm text-red-600">{error}</p><Button className="mt-4" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</Button></div>
      : loading ? <TableSkeleton rows={6} columns={6} />
      : visibleTrays.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-[#F8FBF9] text-[11px] uppercase tracking-wide text-[#718A78]"><tr><th className="px-5 py-4">Mã khay</th><th className="px-5 py-4">Khu vực</th><th className="px-5 py-4">Kệ</th><th className="px-5 py-4">Tầng</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody>{visibleTrays.map((tray) => {
        const rack = rackById.get(tray.rackId);
        const knownStatus = isTrayStatus(tray.currentStatus) ? tray.currentStatus : null;
        return <tr key={tray.soilTrayId} className="border-t border-[#EDF2EE] hover:bg-[#F8FBF9]"><td className="px-5 py-4 font-semibold text-primary">{tray.trayCode}</td><td className="px-5 py-4">{rack ? zoneNames.get(rack.zoneId) || "Chưa xác định" : "—"}</td><td className="px-5 py-4">{rack?.rackCode || "Chưa xác định"}</td><td className="px-5 py-4">{tray.tierIndex}</td><td className="px-5 py-4"><Badge variant="outline" className={knownStatus ? statusClasses[knownStatus] : ""}>{knownStatus ? statusLabels[knownStatus] : tray.currentStatus}</Badge></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" disabled={!rack} onClick={() => { if (rack) router.push(`/staff/trays/areas/${rack.zoneId}?trayId=${tray.soilTrayId}`); }}><Eye />Chi tiết</Button><Button size="sm" variant="outline" disabled={!knownStatus || knownStatus === "RENTED"} onClick={() => openStatusDialog(tray)}><Pencil />Cập nhật</Button></div></td></tr>;
      })}</tbody></table></div>
      : <div className="px-5 py-16 text-center"><Boxes className="mx-auto size-10 text-[#8BAF9A]" /><h3 className="mt-3 font-semibold">Không có khay phù hợp</h3><p className="mt-1 text-sm text-muted-foreground">Thử thay đổi bộ lọc khu vực, kệ hoặc trạng thái.</p></div>}
    </section>

    {createOpen && <StaffTrayFormSheet onClose={() => setCreateOpen(false)} onCreated={() => setReloadKey((value) => value + 1)} />}
    <Dialog open={!!editingTray} onOpenChange={(open) => { if (!open && !saving) setEditingTray(null); }}><DialogContent><DialogHeader><DialogTitle>Cập nhật trạng thái khay</DialogTitle><DialogDescription>Chọn trạng thái mới cho khay {editingTray?.trayCode}.</DialogDescription></DialogHeader><Select value={nextStatus} onValueChange={(value) => setNextStatus(value as TrayStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRAY_STATUSES.filter(status => status !== "RENTED").map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select>{saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}<DialogFooter><Button variant="outline" onClick={() => setEditingTray(null)} disabled={saving}>Hủy</Button><Button onClick={updateStatus} disabled={saving || nextStatus === editingTray?.currentStatus}>{saving ? "Đang lưu..." : "Lưu trạng thái"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof MapPinned; label: string; value: number }) {
  return <Card className="rounded-2xl border-[#E1ECE4] shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-primary"><Icon className="size-5" /></span><div><p className="text-2xl font-bold tabular-nums text-[#173B29]">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>;
}

function ZoneMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-[#F8FBF9] px-2 py-2"><p className="font-bold text-[#173B29]">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}
