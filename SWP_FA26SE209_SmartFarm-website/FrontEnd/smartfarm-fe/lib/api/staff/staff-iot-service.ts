import type { ApiClient } from "../client";
import type { StaffTelemetryReading } from "./staff-telemetry-service";

export const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "INACTIVE"] as const;
export const COMPONENT_TYPES = ["SOIL_MOISTURE", "AIR_TEMP_HUMIDITY", "LIGHT", "WATER_PUMP", "LED_LIGHT", "VENTILATION_FAN"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];
export type ComponentType = (typeof COMPONENT_TYPES)[number];
export type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };
export type IoTDevice = { deviceId: number; deviceCode: string; macAddress: string | null; deviceType: string; firmwareVersion: string | null; status: DeviceStatus | string; lastSeen: string | null };
export type DeviceRequest = { deviceCode: string; macAddress: string | null; deviceType: string; firmwareVersion: string | null; status: DeviceStatus };
export type TrayDevice = { trayDeviceId: number; soilTrayId: number; trayCode: string; deviceId: number; deviceCode: string; pinNumber: string | null; componentType: ComponentType | string; assignedAt: string; isActive: boolean };
export type CameraSnapshot = { snapshotId: number; deviceId: number; rentalId: number; imageUrl: string; takenAt: string };
export type ActuatorLog = { logId: number; deviceId: number; pinNumber: string | null; actuatorType: string; action: string; triggeredBy: string; commandId: string | null; requestedByUserId: number | null; requestedAt: string; acknowledgedAt: string | null; result: string; failureReason: string | null };
export type SystemAlert = { alertId: number; deviceId: number | null; supplyId: number | null; rentalId: number | null; alertType: string; severity: string; message: string; isResolved: boolean; createdAt: string };

export function createStaffIoTService(client: ApiClient) { return {
  async devices(query: { status?: DeviceStatus; search?: string; page?: number; pageSize?: number } = {}) { const r = await client.get<Paged<IoTDevice>>("/staff/iot/devices", { query }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async device(id: number) { const r = await client.get<IoTDevice>(`/staff/iot/devices/${id}`); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async latestTelemetry(id: number) { const r = await client.get<StaffTelemetryReading>(`/staff/iot/devices/${id}/latest`); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async createDevice(body: DeviceRequest) { const r = await client.post<IoTDevice, DeviceRequest>("/staff/iot/devices", body); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async updateDevice(id: number, body: DeviceRequest) { const r = await client.put<IoTDevice, DeviceRequest>(`/staff/iot/devices/${id}`, body); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async updateStatus(id: number, status: DeviceStatus, lastSeen: string | null = null) { const r = await client.put<IoTDevice, { status: DeviceStatus; lastSeen: string | null }>(`/staff/iot/devices/${id}/status`, { status, lastSeen }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async deactivateDevice(id: number) { await client.delete<unknown>(`/staff/iot/devices/${id}`); },
  async trayDevices(query: { soilTrayId?: number; active?: boolean } = {}) { const r = await client.get<TrayDevice[]>("/staff/iot/tray-devices", { query }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async assign(body: { soilTrayId: number; deviceId: number; pinNumber: string | null; componentType: ComponentType }) { const r = await client.post<TrayDevice, typeof body>("/staff/iot/tray-devices", body); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async unassign(id: number) { const r = await client.delete<TrayDevice>(`/staff/iot/tray-devices/${id}`); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async addSnapshot(body: { deviceId: number; rentalId: number; imageUrl: string; takenAt: string | null }) { const r = await client.post<CameraSnapshot, typeof body>("/staff/iot/camera-snapshots", body); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async snapshots(query: { rentalId?: number; deviceId?: number; page?: number; pageSize?: number } = {}) { const r = await client.get<Paged<CameraSnapshot>>("/staff/iot/camera-snapshots", { query }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async logs(query: { deviceId?: number; result?: string; from?: Date; to?: Date; page?: number; pageSize?: number } = {}) { const r = await client.get<Paged<ActuatorLog>>("/staff/iot/actuator-logs", { query }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async command(deviceId: number, body: { actuatorType: "VENTILATION_FAN" | "LED_LIGHT" | "WATER_PUMP"; action: "ON" | "OFF" }) { const r = await client.post<ActuatorLog, typeof body>(`/staff/iot/devices/${deviceId}/actuator-commands`, body); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async commandStatus(commandId: string) { const r = await client.get<ActuatorLog>(`/staff/iot/actuator-commands/${encodeURIComponent(commandId)}`); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async alerts(query: { resolved?: boolean; severity?: string; deviceId?: number; page?: number; pageSize?: number } = {}) { const r = await client.get<Paged<SystemAlert>>("/staff/iot/alerts", { query }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
  async resolveAlert(id: number, isResolved = true) { const r = await client.patch<SystemAlert, { isResolved: boolean }>(`/staff/iot/alerts/${id}/resolve`, { isResolved }); if (!r.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return r.data; },
}; }
