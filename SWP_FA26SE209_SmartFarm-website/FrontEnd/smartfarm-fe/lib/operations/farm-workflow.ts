import { ApiError } from "@/lib/api/client";
import type { FarmRackRequest, FarmZoneRequest, SoilTrayRequest } from "@/lib/api/admin/admin-farm-service";
import type { FarmRack, FarmZoneSummary, SoilTray } from "@/lib/api/staff/staff-farm-service";

export function normalizeZoneName(value: string) {
  const suffix = value.trim().replace(/^khu(?:[\s-]+|$)/i, "").trim()
    .replace(/[\s-]+/g, " ").trim();
  return suffix ? `Khu ${suffix}` : "";
}

export function zoneNameSuffix(value: string) {
  return value.replace(/^\s*khu(?:[\s-]+|$)/i, "");
}

export function trayCodeForPosition(positionId: string, zoneName: string, rackCode: string) {
  const parts = positionId.split("/").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isSafeInteger(part) || part < 1)) return "";
  const name = normalizeZoneName(zoneName);
  if (!name || !rackCode.trim()) return "";
  const [, , tier, slot] = parts.map((part) => part.toString(36).toUpperCase());
  const suffix = `-T${tier}-P${slot}`;
  const zoneCode = name.replace(/[đĐ]/g, "D").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const rackName = rackCode.replace(/[đĐ]/g, "D").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const rackPart = rackName.startsWith(`${zoneCode}-`) ? rackName.slice(zoneCode.length + 1) : rackName;
  if (!rackPart) return "";
  const available = 24 - suffix.length;
  const zoneLength = Math.min(zoneCode.length, Math.max(3, available - rackPart.length - 1));
  const rackLength = available - zoneLength - 1;
  if (rackLength < 1) return "";
  return `${zoneCode.slice(0, zoneLength).replace(/-$/, "")}-${rackPart.slice(-rackLength).replace(/^-/, "")}${suffix}`;
}

export function suggestRackCode(zoneName: string, index: number, used: string[] = []) {
  const prefix = zoneName.replace(/[đĐ]/g, "D").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "KHU";
  const base = prefix.slice(0, 43);
  const reserved = new Set(used.map((code) => code.trim().toUpperCase()));
  let sequence = index + 1;
  let code = `${base}-R${String(sequence).padStart(2, "0")}`;
  while (reserved.has(code)) code = `${base}-R${String(++sequence).padStart(2, "0")}`;
  return code;
}

export function isPossiblyCommitted(error: unknown) {
  return !(error instanceof ApiError) || error.status >= 500;
}

export function rackMatchesRequest(rack: FarmRack, body: FarmRackRequest) {
  return rack.zoneId === body.zoneId &&
    rack.rackCode.trim().toUpperCase() === body.rackCode.trim().toUpperCase() &&
    rack.totalTiers === body.totalTiers && rack.maxTraysPerTier === body.maxTraysPerTier;
}

export async function updateZoneAndConfirm(
  id: number,
  body: FarmZoneRequest,
  update: (id: number, body: FarmZoneRequest) => Promise<FarmZoneSummary>,
  list: () => Promise<FarmZoneSummary[]>,
) {
  try { return await update(id, body); }
  catch (error) {
    if (isPossiblyCommitted(error)) {
      const zones = await list();
      const updated = zones.find((zone) => zone.zoneId === id &&
        zone.zoneName.trim() === body.zoneName.trim() &&
        (zone.locationDescription?.trim() || null) === (body.locationDescription?.trim() || null) &&
        zone.totalCapacity === body.totalCapacity && zone.isActive === body.isActive);
      if (updated) return updated;
    }
    throw error;
  }
}

export async function updateRackAndConfirm(
  id: number,
  body: FarmRackRequest,
  update: (id: number, body: FarmRackRequest) => Promise<FarmRack>,
  list: (zoneId: number) => Promise<FarmRack[]>,
) {
  try { return await update(id, body); }
  catch (error) {
    if (isPossiblyCommitted(error)) {
      const racks = await list(body.zoneId);
      const updated = racks.find((rack) => rack.rackId === id && rackMatchesRequest(rack, body));
      if (updated) return updated;
    }
    throw error;
  }
}

export async function createRackAndConfirm(
  body: FarmRackRequest,
  create: (body: FarmRackRequest) => Promise<FarmRack>,
  list: (zoneId: number) => Promise<FarmRack[]>,
) {
  try { return await create(body); }
  catch (error) {
    if (isPossiblyCommitted(error)) {
      const racks = await list(body.zoneId);
      const created = racks.find((rack) => rackMatchesRequest(rack, body));
      if (created) return created;
    }
    throw error;
  }
}

export async function createTrayAndConfirm(
  body: SoilTrayRequest,
  create: (body: SoilTrayRequest) => Promise<SoilTray>,
  list: (rackId: number) => Promise<SoilTray[]>,
) {
  try { return await create(body); }
  catch (error) {
    if (isPossiblyCommitted(error)) {
      const trays = await list(body.rackId);
      const created = trays.find((tray) => tray.rackId === body.rackId &&
        tray.tierIndex === body.tierIndex &&
        tray.trayCode.trim().toUpperCase() === body.trayCode.trim().toUpperCase() &&
        tray.currentStatus === body.currentStatus);
      if (created) return created;
    }
    throw error;
  }
}
