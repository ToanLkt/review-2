import { adminFarmService } from "@/lib/api/admin/admin-farm-instance";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import { staffDeliveriesService } from "@/lib/api/staff/staff-deliveries-instance";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { FarmRack, FarmZoneSummary, SoilTray } from "@/lib/api/staff/staff-farm-service";
import type { GrowingCycle, DailyTask } from "@/lib/api/staff/staff-cultivation-service";
import type { StaffOrder } from "@/lib/api/staff/staff-orders-service";
import type { StaffDelivery } from "@/lib/api/staff/staff-deliveries-service";
import type { IoTDevice, SystemAlert, TrayDevice } from "@/lib/api/staff/staff-iot-service";
import type { StaffTelemetryReading } from "@/lib/api/staff/staff-telemetry-service";
import type { Device } from "@/lib/types";

export type DashboardDevice = Omit<Device, "temperature" | "humidity" | "light"> & {
  temperature: number | null;
  humidity: number | null;
  light: number | null;
  soilHumidity: number | null;
  waterLevel: number | null;
  deviceId: number;
  trayId?: number;
};

export type DashboardSnapshot = {
  zones: FarmZoneSummary[];
  racks: FarmRack[];
  trays: SoilTray[];
  cycles: GrowingCycle[];
  tasks: DailyTask[];
  orders: StaffOrder[];
  deliveries: StaffDelivery[];
  devices: IoTDevice[];
  assignments: TrayDevice[];
  alerts: SystemAlert[];
  latest: Record<number, StaffTelemetryReading>;
};

async function allPages<T>(load: (page: number) => Promise<{ items: T[]; totalPages: number }>) {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    items.push(...(await load(page)).items);
  }
  return items;
}

export async function loadDashboardSnapshot(role: "admin" | "staff"): Promise<DashboardSnapshot> {
  const farm = role === "admin" ? adminFarmService : staffFarmService;
  const [zones, racks, trays, cycles, tasks, orders, deliveries, devices, assignments, alerts] = await Promise.all([
    farm.zones(),
    farm.racks(),
    farm.trays(),
    staffCultivationService.cycles(),
    staffCultivationService.tasks(),
    allPages((page) => staffOrdersService.list({ page, pageSize: 100 })),
    allPages((page) => staffDeliveriesService.list({ page, pageSize: 100 })),
    allPages((page) => staffIoTService.devices({ page, pageSize: 100 })),
    staffIoTService.trayDevices({ active: true }),
    allPages((page) => staffIoTService.alerts({ page, pageSize: 100 })),
  ]);
  const monitoredDevices = devices.filter((device) => device.status !== "INACTIVE" && assignments.some((assignment) => assignment.deviceId === device.deviceId));
  const readings = await Promise.allSettled(monitoredDevices.map((device) => staffIoTService.latestTelemetry(device.deviceId)));
  const latest: Record<number, StaffTelemetryReading> = {};
  readings.forEach((result, index) => {
    if (result.status === "fulfilled") latest[monitoredDevices[index].deviceId] = result.value;
  });
  return { zones, racks, trays, cycles, tasks, orders, deliveries, devices, assignments, alerts, latest };
}

export function zoneForTray(data: DashboardSnapshot, trayId: number) {
  const tray = data.trays.find((item) => item.soilTrayId === trayId);
  const rack = data.racks.find((item) => item.rackId === tray?.rackId);
  return data.zones.find((item) => item.zoneId === rack?.zoneId)?.zoneName ?? "Chưa xác định";
}

export function todayKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
