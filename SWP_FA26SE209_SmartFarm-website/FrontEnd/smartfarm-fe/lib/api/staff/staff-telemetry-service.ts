import type { ApiClient } from "../client";

export type StaffTelemetryReading = {
  telemetryId: number;
  messageId: string;
  deviceId: number;
  deviceCode: string;
  soilTrayId: number;
  temperature: number | null;
  airHumidity: number | null;
  soilHumidity: number | null;
  lightIntensity: number | null;
  waterLevel: number | null;
  fanState: boolean | null;
  ledState: boolean | null;
  pumpState: boolean | null;
  recordedAt: string;
  isStale: boolean;
};

export type StaffTelemetryHistory = {
  items: StaffTelemetryReading[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type StaffTelemetryHistoryQuery = {
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export function createStaffTelemetryService(client: ApiClient) {
  return {
    async latest(trayId: number) {
      const response = await client.get<StaffTelemetryReading>(
        `/staff/telemetry/trays/${trayId}/latest`,
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async history(trayId: number, query: StaffTelemetryHistoryQuery = {}) {
      const response = await client.get<StaffTelemetryHistory>(
        `/staff/telemetry/trays/${trayId}/history`,
        { query },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
  };
}
