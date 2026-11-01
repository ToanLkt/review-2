"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { adminFarmService } from "@/lib/api/admin/admin-farm-instance";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import type { FarmRackRequest } from "@/lib/api/admin/admin-farm-service";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import type { StaffOrder } from "@/lib/api/staff/staff-orders-service";
import type { CropStatus, GrowingCycle } from "@/lib/api/staff/staff-cultivation-service";
import type { FarmRack, FarmZoneSummary, SoilTray } from "@/lib/api/staff/staff-farm-service";
import { transition, ValidationError, type Operation } from "@/lib/operations/transitions";
import { changeCycle, CycleError, type CycleOperation } from "@/lib/operations/cycles";
import { createRackAndConfirm, createTrayAndConfirm, isPossiblyCommitted, normalizeZoneName, rackMatchesRequest, updateRackAndConfirm, updateZoneAndConfirm } from "@/lib/operations/farm-workflow";
import { readTrayPositions, rememberTrayPosition } from "@/lib/operations/tray-position-memory";
import type { CycleStage, OperationsState, PhysicalTray, PlantingCycle, TrayStatus } from "@/lib/operations/types";
import type { Order } from "@/lib/types";
import { useVarieties } from "@/components/varieties/varieties-provider";

const emptyState: OperationsState = { areas: [], trays: [], items: [], assignments: [], cycles: [], devices: [], revision: 0 };
const areaCreationKey = "smartfarm-admin-area-creation";
const cropLifecycle: Record<string, CycleStage> = { WAITING_PLANTING: "Chuẩn bị", PLANTED: "Đã gieo", GERMINATING: "Nảy mầm", GROWING: "Sinh trưởng", READY_TO_HARVEST: "Sẵn sàng thu hoạch", HARVESTED: "Đã thu hoạch", FAILED: "Đã hủy" };
const cycleStatus: Record<CycleStage, CropStatus> = { "Chuẩn bị": "PLANTED", "Đã gieo": "PLANTED", "Nảy mầm": "GERMINATING", "Sinh trưởng": "GROWING", "Sẵn sàng thu hoạch": "READY_TO_HARVEST", "Đã thu hoạch": "HARVESTED", "Đã hủy": "FAILED" };
const trayStatusToUi = (status: string, hasCycle: boolean): TrayStatus => status === "AVAILABLE" ? "Sẵn sàng" : status === "RENTED" ? (hasCycle ? "Đang trồng" : "Đã giữ chỗ") : "Bảo trì";
const trayStatusToApi = (status: TrayStatus) => status === "Sẵn sàng" ? "AVAILABLE" as const : status === "Bảo trì" || status === "Chờ vệ sinh" ? "MAINTENANCE" as const : "RENTED" as const;
const friendlyError = (reason: unknown) => {
  const text = reason instanceof Error ? reason.message : "";
  return /backend|frontend|\bapi\b|\bfe\b|\bbe\b/i.test(text) || !text
    ? "Không thể xử lý dữ liệu trang trại. Vui lòng thử lại."
    : text;
};

function positionId(zoneId: number, rackId: number, tier: number, slot: number) { return `${zoneId}/${rackId}/${tier}/${slot}`; }
function positionParts(value: string | null) { const [, rackId, tier] = (value ?? "").split("/").map(Number); return { rackId, tierIndex: tier }; }

type AreaCreationProgress = {
  zoneId: number;
  zoneName: string;
  racks: { id: number; code: string; draftId: string }[];
};

export function readAreaCreation(): AreaCreationProgress | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(areaCreationKey) ?? "null");
    if (!value || typeof value !== "object") return null;
    const progress = value as Partial<AreaCreationProgress>;
    if (!Number.isInteger(progress.zoneId) || typeof progress.zoneName !== "string" || !Array.isArray(progress.racks)) return null;
    if (!progress.racks.every((rack) => Number.isInteger(rack.id) && typeof rack.code === "string" && typeof rack.draftId === "string")) return null;
    return progress as AreaCreationProgress;
  } catch { return null; }
}

function writeAreaCreation(progress: AreaCreationProgress | null) {
  if (progress) window.localStorage.setItem(areaCreationKey, JSON.stringify(progress));
  else window.localStorage.removeItem(areaCreationKey);
}

function toOperationOrder(order: StaffOrder): Order {
  const base = {
    id: String(order.orderId), customer: order.customerName || `Khách hàng #${order.customerId}`,
    total: order.totalAmount,
    payment: ["AWAITING_PAYMENT", "EXPIRED", "CANCELLED"].includes(order.status) ? "Chờ thanh toán" as const : "Đã xác nhận" as const,
    status: order.status === "COMPLETED" ? "Hoàn tất" as const : ["EXPIRED", "CANCELLED"].includes(order.status) ? "Đã hủy" as const : "Đang xử lý" as const,
    created: order.createdAt,
  };
  return order.orderType === "TRAY_RENTAL"
    ? { ...base, kind: "rental", trayIds: order.rentals.map((rental) => String(rental.soilTrayId)), batches: [] }
    : { ...base, kind: "retail", products: order.items.map((item) => ({ name: item.supplyName, quantity: item.quantity, price: item.unitPrice })), shipping: order.shippingAddress ?? "" };
}

function adapt(zones: FarmZoneSummary[], racks: FarmRack[], trays: SoilTray[], cycles: GrowingCycle[], orders: StaffOrder[], supplyNames: Map<number, string>, rememberedPositions: Record<string, string>): OperationsState {
  const cycleByTray = new Map(cycles.map((cycle) => [cycle.soilTrayId, cycle]));
  const orderByRental = new Map(orders.flatMap((order) => order.rentals.map((rental) => [rental.trayRentalId, order] as const)));
  const occupiedPositions = new Set<string>();
  const rememberedByTray = new Map<number, string>();
  for (const tray of trays) {
    const rack = racks.find((item) => item.rackId === tray.rackId);
    const remembered = rememberedPositions[tray.trayCode.trim().toUpperCase()];
    if (!rack || !remembered) continue;
    const [zoneId, rackId, tier, slot] = remembered.split("/").map(Number);
    if (zoneId === rack.zoneId && rackId === tray.rackId && tier === tray.tierIndex && slot >= 1 && slot <= rack.maxTraysPerTier && !occupiedPositions.has(remembered)) {
      rememberedByTray.set(tray.soilTrayId, remembered);
      occupiedPositions.add(remembered);
    }
  }
  const areas = zones.map((zone) => ({
    id: String(zone.zoneId), code: `KV-${zone.zoneId}`, name: normalizeZoneName(zone.zoneName),
    location: zone.locationDescription || "Chưa cập nhật vị trí", description: "",
    status: zone.isActive ? "Hoạt động" as const : "Ngừng sử dụng" as const,
    shelves: racks.filter((rack) => rack.zoneId === zone.zoneId).map((rack) => ({ id: String(rack.rackId), name: rack.rackCode, levels: rack.totalTiers, positionsPerLevel: rack.maxTraysPerTier })),
  }));
  const physicalTrays: PhysicalTray[] = trays.map((tray) => {
    const rack = racks.find((item) => item.rackId === tray.rackId);
    let resolvedPosition: string | null = null;
    if (rack) {
      const remembered = rememberedByTray.get(tray.soilTrayId);
      if (remembered) resolvedPosition = remembered;
      else {
        let candidate = 1;
        while (occupiedPositions.has(positionId(rack.zoneId, tray.rackId, tray.tierIndex, candidate))) candidate++;
        resolvedPosition = positionId(rack.zoneId, tray.rackId, tray.tierIndex, candidate);
        occupiedPositions.add(resolvedPosition);
      }
    }
    return { id: String(tray.soilTrayId), code: tray.trayCode, specification: "Khay trồng", positionId: resolvedPosition, status: trayStatusToUi(tray.currentStatus, cycleByTray.has(tray.soilTrayId)), notes: "", history: [{ id: `tray-${tray.soilTrayId}`, type: "created", text: "Khay đang được quản lý trong trang trại", at: new Date().toISOString(), staff: "Hệ thống" }] };
  });
  const assignments = cycles.map((cycle) => { const order = orderByRental.get(cycle.rentalId); return { id: `PB-${cycle.rentalId}`, trayId: String(cycle.soilTrayId), itemId: `ITEM-${cycle.rentalId}`, orderId: order ? String(order.orderId) : "", orderCode: order?.orderCode, customer: order?.customerName || "—", active: !["HARVESTED", "FAILED"].includes(cycle.cropStatus), assignedAt: cycle.startDate }; });
  const items = cycles.map((cycle) => ({ id: `ITEM-${cycle.rentalId}`, orderId: String(orderByRental.get(cycle.rentalId)?.orderId ?? ""), seed: supplyNames.get(cycle.supplyId) || `Giống #${cycle.supplyId}`, quantity: 1 }));
  const plantingCycles: PlantingCycle[] = cycles.map((cycle) => {
    const life = cropLifecycle[cycle.cropStatus] || "Chuẩn bị";
    const stage = life === "Sẵn sàng thu hoạch" ? "Sẵn sàng thu hoạch" : life === "Sinh trưởng" ? "Đang phát triển" : "Ươm mầm";
    return { id: String(cycle.rentalId), currentCycle: cycle.currentCycle, totalCycles: cycle.totalCycles, hasNextCycle: cycle.hasNextCycle, trayId: String(cycle.soilTrayId), assignmentId: `PB-${cycle.rentalId}`, varietyId: String(cycle.supplyId), seed: supplyNames.get(cycle.supplyId) || `Giống #${cycle.supplyId}`, sowed: cycle.startDate.slice(0, 10), harvest: cycle.expectedHarvestDate.slice(0, 10), stage, lifecycle: life, active: !["HARVESTED", "FAILED"].includes(cycle.cropStatus), timeline: [{ text: "Bắt đầu chu kỳ", at: cycle.startDate, staff: "Nhân viên", notes: "" }] };
  });
  return { areas, trays: physicalTrays, items, assignments, cycles: plantingCycles, devices: [], revision: Date.now() };
}

function useOperationsState(farmScope: "admin" | "staff" = "admin") {
  const [state, setState] = useState<OperationsState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ref = useRef(state); const [orders, setOrders] = useState<Order[]>([]); const { catalog } = useVarieties();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const farmService = farmScope === "staff" ? staffFarmService : adminFarmService;
      const [zones, racks, trays, cycles, supplies, firstOrders] = await Promise.all([farmService.zones(), farmService.racks(), farmService.trays(), staffCultivationService.cycles(), staffCultivationService.supplies({ type: "SEED" }), staffOrdersService.list({ page: 1, pageSize: 100 })]);
      const otherOrders = await Promise.all(Array.from({ length: Math.max(0, firstOrders.totalPages - 1) }, (_, index) => staffOrdersService.list({ page: index + 2, pageSize: 100 })));
      const orderItems = [firstOrders, ...otherOrders].flatMap((page) => page.items);
      setOrders(orderItems.map(toOperationOrder));
      const next = adapt(zones, racks, trays, cycles, orderItems, new Map(supplies.map((s) => [s.supplyId, s.supplyName])), readTrayPositions()); ref.current = next; setState(next);
    } catch (reason) { const text = friendlyError(reason); setError(text); toast.error("Không thể tải dữ liệu trang trại.", { description: text }); }
    finally { setLoading(false); }
  }, [farmScope]);
  useEffect(() => { const id = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(id); }, [load]);

  async function persist(action: Operation | CycleOperation) {
    if (action.type === "area-save") {
      const body = { zoneName: normalizeZoneName(action.draft.name), locationDescription: action.draft.location.trim() || null, totalCapacity: action.draft.shelves.reduce((sum, shelf) => sum + shelf.levels * shelf.positionsPerLevel, 0), isActive: true };
      const pending = !action.id ? readAreaCreation() : null;
      const progress = pending && normalizeZoneName(pending.zoneName) === body.zoneName ? pending : null;
      const allRacks = await adminFarmService.racks();
      const conflict = action.draft.shelves.find((shelf) => allRacks.some((rack) =>
        rack.rackCode.trim().toUpperCase() === shelf.name.trim().toUpperCase() &&
        String(rack.rackId) !== shelf.id &&
        !progress?.racks.some((saved) => saved.id === rack.rackId &&
          (saved.draftId === shelf.id || saved.code.toUpperCase() === shelf.name.trim().toUpperCase()))));
      if (conflict) throw new ValidationError(`Mã kệ ${conflict.name.trim()} đã tồn tại. Vui lòng chọn mã khác.`, "shelves");
      if (!action.id) {
        let current = progress;
        if (!current) {
          let zone;
          try { zone = await adminFarmService.createZone(body); }
          catch (reason) {
            if (!isPossiblyCommitted(reason)) throw reason;
            const zones = await adminFarmService.zones();
            zone = zones.find((item) => normalizeZoneName(item.zoneName) === body.zoneName);
            if (!zone) throw reason;
          }
          current = { zoneId: zone.zoneId, zoneName: body.zoneName, racks: [] };
          writeAreaCreation(current);
        } else {
          await updateZoneAndConfirm(current.zoneId, body, adminFarmService.updateZone, adminFarmService.zones);
        }
        if (current.racks.some((rack) => !action.draft.shelves.some((shelf) => shelf.id === rack.draftId || shelf.name.trim().toUpperCase() === rack.code.toUpperCase())))
          throw new ValidationError("Một kệ đã được tạo ở lần lưu trước. Hãy giữ kệ đó để hoàn tất; sau đó có thể chỉnh sửa khu vực.", "shelves");
        for (const shelf of action.draft.shelves) {
          const rackBody: FarmRackRequest = { zoneId: current.zoneId, rackCode: shelf.name.trim(), totalTiers: shelf.levels, maxTraysPerTier: shelf.positionsPerLevel };
          const saved = current.racks.find((rack) => rack.draftId === shelf.id) ??
            current.racks.find((rack) => rack.code.toUpperCase() === rackBody.rackCode.toUpperCase());
          let rack;
          if (saved) rack = await updateRackAndConfirm(saved.id, rackBody, adminFarmService.updateRack, adminFarmService.racks);
          else rack = await createRackAndConfirm(rackBody, adminFarmService.createRack, adminFarmService.racks);
          current.racks = [...current.racks.filter((item) => item.id !== rack.rackId), { id: rack.rackId, code: rack.rackCode, draftId: shelf.id }];
          writeAreaCreation(current);
        }
        writeAreaCreation(null);
      }
      else {
        const zoneId = Number(action.id);
        await updateZoneAndConfirm(zoneId, body, adminFarmService.updateZone, adminFarmService.zones);
        // Always reconcile against the latest server state. The local snapshot can be
        // stale when racks were added elsewhere, which would otherwise turn an update
        // into a duplicate POST with the same rack code.
        const currentRacks = await adminFarmService.racks(zoneId);
        const oldIds = new Set(currentRacks.map((rack) => String(rack.rackId)));
        const nextIds = new Set(action.draft.shelves.map((shelf) => shelf.id));
        for (const shelf of action.draft.shelves) {
          const rackBody = { zoneId, rackCode: shelf.name.trim(), totalTiers: shelf.levels, maxTraysPerTier: shelf.positionsPerLevel };
          const existing = currentRacks.find((rack) => String(rack.rackId) === shelf.id);
          if (existing) {
            if (!rackMatchesRequest(existing, rackBody))
              await updateRackAndConfirm(existing.rackId, rackBody, adminFarmService.updateRack, adminFarmService.racks);
          } else await createRackAndConfirm(rackBody, adminFarmService.createRack, adminFarmService.racks);
        }
        for (const id of oldIds) if (!nextIds.has(id)) await adminFarmService.deleteRack(Number(id));
      }
    } else if (action.type === "area-maintenance") await adminFarmService.deactivateZone(Number(action.id));
    else if (action.type === "tray-save") {
      const place = positionParts(action.draft.positionId);
      const body = { ...place, trayCode: action.draft.code.trim(), currentStatus: "AVAILABLE" as const };
      if (action.id) {
        const current = (await adminFarmService.trays()).find((tray) => tray.soilTrayId === Number(action.id));
        if (!current) throw new ValidationError("Không tìm thấy khay cần cập nhật.", "form");
        await adminFarmService.updateTray(Number(action.id), { ...body, currentStatus: current.currentStatus as import("@/lib/api/staff/staff-farm-service").TrayStatus });
      } else await createTrayAndConfirm(body, adminFarmService.createTray, (rackId) => adminFarmService.trays({ rackId }));
      rememberTrayPosition(action.draft.code, action.draft.positionId);
    }
    else if (action.type === "tray-move") { await adminFarmService.moveTray(Number(action.id), positionParts(action.positionId)); const tray = ref.current.trays.find((item) => item.id === action.id); if (tray) rememberTrayPosition(tray.code, action.positionId); }
    else if (action.type === "tray-status") await adminFarmService.updateTrayStatus(Number(action.id), trayStatusToApi(action.status));
    else if (action.type === "cycle-stage") await staffCultivationService.updateCycleStatus(Number(action.id), cycleStatus[action.stage]);
    else if (action.type === "cycle-harvest") await staffCultivationService.harvest(Number(action.id), action.day);
    else if (action.type === "cycle-cancel") await staffCultivationService.updateCycleStatus(Number(action.id), "FAILED");
  }

  async function areaDetail(id: string) {
    try {
      const zoneId = Number(id);
      const [zone, racks] = await Promise.all([
        adminFarmService.zone(zoneId),
        adminFarmService.racks(zoneId),
      ]);
      const area = ref.current.areas.find((item) => item.id === id);
      if (!area) return null;
      const next = {
        ...area,
        name: normalizeZoneName(zone.zoneName),
        location: zone.locationDescription || "Chưa cập nhật vị trí",
        status: zone.isActive ? "Hoạt động" as const : "Ngừng sử dụng" as const,
        shelves: racks.map((rack) => ({
          id: String(rack.rackId),
          name: rack.rackCode,
          levels: rack.totalTiers,
          positionsPerLevel: rack.maxTraysPerTier,
        })),
      };
      const stateNext = { ...ref.current, areas: ref.current.areas.map((item) => item.id === id ? next : item) };
      ref.current = stateNext; setState(stateNext); return next;
    } catch (reason) { toast.error("Không thể tải thông tin khu vực.", { description: friendlyError(reason) }); return null; }
  }

  async function deleteTray(id: string) {
    try { const tray = ref.current.trays.find((item) => item.id === id); await adminFarmService.deleteTray(Number(id)); if (tray) rememberTrayPosition(tray.code, null); toast.success("Đã xóa khay."); await load(); return true; }
    catch (reason) { toast.error("Không thể xóa khay.", { description: friendlyError(reason) }); return false; }
  }

  async function execute(action: Operation | CycleOperation, successMessage: string): Promise<{ ok: true } | { ok: false; field: string; message: string }> {
    const previous = ref.current;
    let next: OperationsState;
    try {
      const pending = action.type === "area-save" && !action.id ? readAreaCreation() : null;
      const validationAction = action.type === "area-save" && pending && normalizeZoneName(pending.zoneName) === normalizeZoneName(action.draft.name)
        ? { ...action, pendingZoneId: String(pending.zoneId) } : action;
      next = action.type.startsWith("cycle-") ? changeCycle(previous, action as CycleOperation, orders, catalog, new Date().toISOString()) : transition(previous, validationAction as Operation, orders, new Date().toISOString());
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : "Không thể lưu thay đổi.";
      toast.error(text); return { ok: false, message: text, field: reason instanceof ValidationError || reason instanceof CycleError ? reason.field : "form" };
    }
    try {
      await persist(action);
      ref.current = next; setState(next);
      await load();
      toast.success(successMessage);
      return { ok: true };
    } catch (reason) {
      const text = friendlyError(reason);
      toast.error("Không thể lưu thay đổi.", { description: text });
      await load();
      return { ok: false, message: text, field: reason instanceof ValidationError ? reason.field : "form" };
    }
  }
  function releaseOrder(orderId?: string) { void orderId; void load(); }
  return { state, execute, orders, releaseOrder, loading, error, reload: load, areaDetail, deleteTray };
}

const Context = createContext<ReturnType<typeof useOperationsState> | null>(null);
export function OperationsProvider({ children, farmScope = "admin" }: { children: ReactNode; farmScope?: "admin" | "staff" }) { return <Context.Provider value={useOperationsState(farmScope)}>{children}</Context.Provider>; }
export function useOperations() { const value = useContext(Context); if (!value) throw new Error("Thiếu dữ liệu vận hành"); return value; }
