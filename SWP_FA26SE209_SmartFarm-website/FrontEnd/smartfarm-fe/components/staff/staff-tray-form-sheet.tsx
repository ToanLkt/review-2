"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/ui/loading-state";
import { DiscardDialog } from "@/components/operations/shared/discard-dialog";
import { Choice, Field, FormError, PhysicalStatus } from "@/components/operations/shared/ui";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import type { FarmRack, FarmZoneSummary, SoilTray } from "@/lib/api/staff/staff-farm-service";
import { trayCodeForPosition } from "@/lib/operations/farm-workflow";
import { readTrayPositions, rememberTrayPosition } from "@/lib/operations/tray-position-memory";

type Location = { zoneId: string; rackId: string; tier: string; slot: string };
const emptyLocation: Location = { zoneId: "", rackId: "", tier: "", slot: "" };

function occupiedSlots(trays: SoilTray[], rack: FarmRack, tier: number) {
  const atTier = trays.filter((tray) => tray.rackId === rack.rackId && tray.tierIndex === tier);
  const remembered = readTrayPositions();
  const occupied = new Set<number>();
  const unplaced: SoilTray[] = [];
  for (const tray of atTier) {
    const parts = remembered[tray.trayCode.trim().toUpperCase()]?.split("/").map(Number);
    const slot = parts?.[3];
    if (parts?.[0] === rack.zoneId && parts[1] === rack.rackId && parts[2] === tier && slot && slot <= rack.maxTraysPerTier && !occupied.has(slot)) occupied.add(slot);
    else unplaced.push(tray);
  }
  for (let index = 0; index < unplaced.length; index++) {
    for (let slot = 1; slot <= rack.maxTraysPerTier; slot++) {
      if (!occupied.has(slot)) { occupied.add(slot); break; }
    }
  }
  return occupied;
}

export function StaffTrayFormSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [zones, setZones] = useState<FarmZoneSummary[]>([]);
  const [racks, setRacks] = useState<FarmRack[]>([]);
  const [trays, setTrays] = useState<SoilTray[]>([]);
  const [location, setLocation] = useState<Location>(emptyLocation);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([staffFarmService.zones(), staffFarmService.racks(), staffFarmService.trays()])
      .then(([nextZones, nextRacks, nextTrays]) => {
        if (active) { setZones(nextZones); setRacks(nextRacks); setTrays(nextTrays); }
      })
      .catch((reason: unknown) => {
        if (active) setLoadError(reason instanceof Error ? reason.message : "Không thể tải vị trí khay.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const zone = zones.find((item) => String(item.zoneId) === location.zoneId);
  const rack = racks.find((item) => String(item.rackId) === location.rackId && String(item.zoneId) === location.zoneId);
  const tier = Number(location.tier);
  const tierTrayCount = rack && tier ? trays.filter((tray) => tray.rackId === rack.rackId && tray.tierIndex === tier).length : 0;
  const zoneTrayCount = zone ? trays.filter((tray) => racks.some((item) => item.rackId === tray.rackId && item.zoneId === zone.zoneId)).length : 0;
  const zoneFull = !!zone && zoneTrayCount >= zone.totalCapacity;
  const tierFull = !!rack && !!tier && tierTrayCount >= rack.maxTraysPerTier;
  const occupied = rack && tier ? occupiedSlots(trays, rack, tier) : new Set<number>();
  const slots = rack && tier && !zoneFull ? Array.from({ length: rack.maxTraysPerTier }, (_, index) => index + 1).filter((slot) => !occupied.has(slot)) : [];
  const positionId = zone && rack && tier && location.slot ? `${zone.zoneId}/${rack.rackId}/${tier}/${location.slot}` : "";
  const trayCode = positionId && zone && rack ? trayCodeForPosition(positionId, zone.zoneName, rack.rackCode) : "";
  const dirty = Object.values(location).some(Boolean);

  function requestClose() {
    if (saving) return;
    if (dirty) setDiscard(true);
    else onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!zone || !rack || !tier || !location.slot || !slots.includes(Number(location.slot)) || !trayCode) {
      setFormError("Vui lòng chọn đầy đủ khu vực, kệ, tầng và vị trí trống.");
      return;
    }
    if (trays.some((tray) => tray.trayCode.toUpperCase() === trayCode.toUpperCase())) {
      setFormError("Mã khay đã tồn tại. Vui lòng chọn vị trí khác.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await staffFarmService.createTray({ rackId: rack.rackId, trayCode, tierIndex: tier, currentStatus: "AVAILABLE" });
      try { rememberTrayPosition(trayCode, positionId); } catch { /* Vẫn giữ kết quả tạo khay nếu trình duyệt không lưu được vị trí. */ }
      toast.success("Đã tạo khay sẵn sàng.");
      onCreated();
      onClose();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Không thể tạo khay.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <Sheet open onOpenChange={(open) => { if (!open) requestClose(); }}>
      <SheetContent>
        <SheetHeader><SheetTitle>Thêm khay</SheetTitle><SheetDescription>Thông tin khay vật lý và vị trí bố trí trong nông trại.</SheetDescription></SheetHeader>
        {loading ? <div className="px-6"><TableSkeleton rows={4} columns={1} /></div> : loadError ? <div className="px-6"><FormError message={loadError} /></div> : <form noValidate onSubmit={submit} className="space-y-5 overflow-y-auto px-6 pb-6">
          <PhysicalStatus status="Sẵn sàng" />
          <Field label="Mã khay (tự động)" htmlFor="staff-tray-code">
            <Input id="staff-tray-code" value={trayCode} readOnly aria-readonly="true" placeholder="Chọn đủ khu vực, kệ, tầng và vị trí" />
          </Field>
          <p className="text-xs text-muted-foreground">Mã khay gồm tên khu vực, mã kệ, tầng và vị trí; tên dài sẽ được rút gọn để phù hợp giới hạn mã.</p>
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Vị trí bố trí</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Khu vực"><Choice label="Khu vực khay" value={location.zoneId} onChange={(zoneId) => { setLocation({ zoneId, rackId: "", tier: "", slot: "" }); setFormError(""); }} options={[{ value: "", label: "Chọn khu vực" }, ...zones.filter((item) => item.isActive).map((item) => ({ value: String(item.zoneId), label: item.zoneName }))]} /></Field>
              <Field label="Kệ"><Choice label="Kệ của khay" value={location.rackId} disabled={!location.zoneId} onChange={(rackId) => { setLocation({ ...location, rackId, tier: "", slot: "" }); setFormError(""); }} options={[{ value: "", label: "Chọn kệ" }, ...racks.filter((item) => String(item.zoneId) === location.zoneId).map((item) => ({ value: String(item.rackId), label: item.rackCode }))]} /></Field>
              <Field label="Tầng"><Choice label="Tầng của khay" value={location.tier} disabled={!rack} onChange={(tierValue) => { setLocation({ ...location, tier: tierValue, slot: "" }); setFormError(""); }} options={[{ value: "", label: "Chọn tầng" }, ...Array.from({ length: rack?.totalTiers ?? 0 }, (_, index) => ({ value: String(index + 1), label: `Tầng ${index + 1}` }))]} /></Field>
              <Field label="Vị trí"><Choice label="Vị trí khay" value={location.slot} disabled={!tier || zoneFull || tierFull} onChange={(slot) => { setLocation({ ...location, slot }); setFormError(""); }} options={[{ value: "", label: !tier ? "Chọn tầng trước" : zoneFull ? "Khu vực đã đầy" : tierFull ? "Tầng đã đầy" : "Chọn vị trí trống" }, ...slots.map((slot) => ({ value: String(slot), label: `Vị trí ${slot}` }))]} /></Field>
            </div>
            {rack && tier > 0 && <p className={`text-xs ${zoneFull || tierFull ? "text-amber-700" : "text-muted-foreground"}`}>
              Tầng {tier}: {tierTrayCount}/{rack.maxTraysPerTier} khay. Khu vực: {zoneTrayCount}/{zone?.totalCapacity ?? 0} khay.
              {zoneFull ? " Khu vực đã hết sức chứa; cần mở rộng khu vực trước khi thêm khay." : tierFull ? " Hãy chọn tầng hoặc kệ còn chỗ." : ""}
            </p>}
          </div>
          <FormError message={formError} />
          <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={requestClose} disabled={saving}>Hủy</Button><Button type="submit" disabled={saving || !trayCode}>{saving ? "Đang lưu..." : "Tạo khay"}</Button></div>
        </form>}
      </SheetContent>
    </Sheet>
    <DiscardDialog open={discard} onOpenChange={setDiscard} onConfirm={onClose} />
  </>;
}
