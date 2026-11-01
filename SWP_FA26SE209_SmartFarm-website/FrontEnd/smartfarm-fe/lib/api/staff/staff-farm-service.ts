import type { ApiClient } from "../client";

export const TRAY_STATUSES = ["AVAILABLE", "RENTED", "MAINTENANCE", "INACTIVE"] as const;
export type TrayStatus = (typeof TRAY_STATUSES)[number];

export type FarmZoneSummary = {
  zoneId: number;
  zoneName: string;
  locationDescription: string | null;
  totalCapacity: number;
  isActive: boolean;
  rackCount: number;
  trayCount: number;
  availableTrays: number;
};

export type FarmRack = {
  rackId: number;
  zoneId: number;
  rackCode: string;
  totalTiers: number;
  maxTraysPerTier: number;
};

export type SoilTray = {
  soilTrayId: number;
  rackId: number;
  trayCode: string;
  tierIndex: number;
  currentStatus: TrayStatus | string;
};

export type CreateSoilTrayRequest = {
  rackId: number;
  trayCode: string;
  tierIndex: number;
  currentStatus: TrayStatus;
};

export function createStaffFarmService(client: ApiClient) {
  return {
    async zones() {
      const response = await client.get<FarmZoneSummary[]>("/staff/farm/zones");
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async racks(zoneId?: number) {
      const response = await client.get<FarmRack[]>("/staff/farm/racks", {
        query: { zoneId },
      });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async trays(query: { rackId?: number; status?: TrayStatus } = {}) {
      const response = await client.get<SoilTray[]>("/staff/farm/trays", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async createTray(request: CreateSoilTrayRequest) {
      const response = await client.post<SoilTray, CreateSoilTrayRequest>("/staff/farm/trays", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async updateTrayStatus(trayId: number, status: TrayStatus) {
      const response = await client.put<SoilTray, { status: TrayStatus }>(
        `/staff/farm/trays/${trayId}/status`,
        { status },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
  };
}
