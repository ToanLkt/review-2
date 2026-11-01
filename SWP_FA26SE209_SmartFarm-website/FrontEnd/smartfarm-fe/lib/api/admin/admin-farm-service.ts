import { ApiError, type ApiClient } from "../client";
import type { FarmRack, FarmZoneSummary, SoilTray, TrayStatus } from "../staff/staff-farm-service";

export type FarmZoneRequest = { zoneName: string; locationDescription?: string | null; totalCapacity: number; isActive: boolean };
export type FarmRackRequest = { zoneId: number; rackCode: string; totalTiers: number; maxTraysPerTier: number };
export type SoilTrayRequest = { rackId: number; trayCode: string; tierIndex: number; currentStatus: TrayStatus };
export type TrayLocationRequest = { rackId: number; tierIndex: number };

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

async function recoverCommittedWrite<T>(
  error: unknown,
  reload: () => Promise<T[]>,
  matches: (item: T) => boolean,
) {
  if (!(error instanceof ApiError) || error.status !== 500) throw error;
  const item = (await reload()).find(matches);
  if (!item) throw error;
  return item;
}

export function createAdminFarmService(client: ApiClient) {
  return {
    async zones() { return required((await client.get<FarmZoneSummary[]>("/admin/farm/zones")).data, "Không nhận được danh sách khu vực."); },
    async zone(id: number) { return required((await client.get<FarmZoneSummary>(`/admin/farm/zones/${id}`)).data, "Không nhận được thông tin khu vực."); },
    async createZone(body: FarmZoneRequest) {
      try {
        return required((await client.post<FarmZoneSummary, FarmZoneRequest>("/admin/farm/zones", body)).data, "Không nhận được thông tin khu vực vừa tạo.");
      } catch (error) {
        return recoverCommittedWrite(error, () => this.zones(), (zone) =>
          zone.zoneName === body.zoneName
          && zone.totalCapacity === body.totalCapacity
          && zone.isActive === body.isActive);
      }
    },
    async updateZone(id: number, body: FarmZoneRequest) {
      try {
        return required((await client.put<FarmZoneSummary, FarmZoneRequest>(`/admin/farm/zones/${id}`, body)).data, "Không nhận được thông tin khu vực đã cập nhật.");
      } catch (error) {
        return recoverCommittedWrite(error, () => this.zones(), (zone) =>
          zone.zoneId === id
          && zone.zoneName === body.zoneName
          && zone.totalCapacity === body.totalCapacity
          && zone.isActive === body.isActive);
      }
    },
    async deactivateZone(id: number) { await client.delete<unknown>(`/admin/farm/zones/${id}`); },

    async racks(zoneId?: number) { return required((await client.get<FarmRack[]>("/admin/farm/racks", { query: { zoneId } })).data, "Không nhận được danh sách kệ."); },
    async createRack(body: FarmRackRequest) {
      try {
        return required((await client.post<FarmRack, FarmRackRequest>("/admin/farm/racks", body)).data, "Không nhận được thông tin kệ vừa tạo.");
      } catch (error) {
        return recoverCommittedWrite(error, () => this.racks(body.zoneId), (rack) =>
          rack.rackCode === body.rackCode
          && rack.totalTiers === body.totalTiers
          && rack.maxTraysPerTier === body.maxTraysPerTier);
      }
    },
    async updateRack(id: number, body: FarmRackRequest) {
      try {
        return required((await client.put<FarmRack, FarmRackRequest>(`/admin/farm/racks/${id}`, body)).data, "Không nhận được thông tin kệ đã cập nhật.");
      } catch (error) {
        return recoverCommittedWrite(error, () => this.racks(body.zoneId), (rack) =>
          rack.rackId === id
          && rack.rackCode === body.rackCode
          && rack.totalTiers === body.totalTiers
          && rack.maxTraysPerTier === body.maxTraysPerTier);
      }
    },
    async deleteRack(id: number) { await client.delete<unknown>(`/admin/farm/racks/${id}`); },

    async trays(query: { rackId?: number; status?: TrayStatus } = {}) { return required((await client.get<SoilTray[]>("/admin/farm/trays", { query })).data, "Không nhận được danh sách khay."); },
    async createTray(body: SoilTrayRequest) {
      try {
        return required((await client.post<SoilTray, SoilTrayRequest>("/admin/farm/trays", body)).data, "Không nhận được thông tin khay vừa tạo.");
      } catch (error) {
        return recoverCommittedWrite(error, () => this.trays({ rackId: body.rackId }), (tray) =>
          tray.trayCode === body.trayCode
          && tray.tierIndex === body.tierIndex
          && tray.currentStatus === body.currentStatus);
      }
    },
    async updateTray(id: number, body: SoilTrayRequest) {
      try {
        return required((await client.put<SoilTray, SoilTrayRequest>(`/admin/farm/trays/${id}`, body)).data, "Không nhận được thông tin khay đã cập nhật.");
      } catch (error) {
        return recoverCommittedWrite(error, () => this.trays({ rackId: body.rackId }), (tray) =>
          tray.soilTrayId === id
          && tray.trayCode === body.trayCode
          && tray.tierIndex === body.tierIndex
          && tray.currentStatus === body.currentStatus);
      }
    },
    async updateTrayStatus(id: number, status: TrayStatus) { return required((await client.put<SoilTray, { status: TrayStatus }>(`/admin/farm/trays/${id}/status`, { status })).data, "Không nhận được trạng thái khay mới."); },
    async moveTray(id: number, body: TrayLocationRequest) { return required((await client.put<SoilTray, TrayLocationRequest>(`/admin/farm/trays/${id}/location`, body)).data, "Không nhận được vị trí mới của khay."); },
    async deleteTray(id: number) { await client.delete<unknown>(`/admin/farm/trays/${id}`); },
  };
}
