import { adminFarmService } from "@/lib/api/admin/admin-farm-instance";
import { staffIoTService } from "./staff-iot-instance";
import { staffTelemetryService } from "./staff-telemetry-instance";
import type { StaffTelemetryReading } from "./staff-telemetry-service";
import type { IoTDevice, Paged, SystemAlert } from "./staff-iot-service";
import type { EnvironmentDevice, Measurement, MeasurementLocation, Metric } from "@/lib/environment";

type Area = { id: string; name: string; total: number; online: number; offline: number; stale: number; lastReceived?: string };
export type LiveEnvironmentAlert = { id: string; title: string; deviceCode: string; location: string; severity: "warning" | "error"; at: string };
export type EnvironmentSnapshot = { devices: EnvironmentDevice[]; locations: MeasurementLocation[]; measurements: Measurement[]; alerts: LiveEnvironmentAlert[]; areas: Area[] };

async function allPages<T>(load: (page: number) => Promise<Paged<T>>) {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) items.push(...(await load(page)).items);
  return items;
}

const metrics: { key: keyof StaffTelemetryReading; metric: Metric; unit: Measurement["unit"] }[] = [
  { key: "temperature", metric: "temperature", unit: "°C" },
  { key: "airHumidity", metric: "airHumidity", unit: "%" },
  { key: "soilHumidity", metric: "soilMoisture", unit: "%" },
  { key: "lightIntensity", metric: "light", unit: "lux" },
  { key: "waterLevel", metric: "waterLevel", unit: "%" },
];

export async function loadEnvironment(): Promise<EnvironmentSnapshot> {
  const [zones, racks, trays, assignments, devices, alerts] = await Promise.all([
    adminFarmService.zones(), adminFarmService.racks(), adminFarmService.trays(),
    staffIoTService.trayDevices({ active: true }),
    allPages<IoTDevice>((page) => staffIoTService.devices({ page, pageSize: 100 })),
    allPages<SystemAlert>((page) => staffIoTService.alerts({ resolved: false, page, pageSize: 100 })),
  ]);
  const assigned = new Map<number, number>();
  for (const item of assignments) if (!assigned.has(item.deviceId)) assigned.set(item.deviceId, item.soilTrayId);
  const readings = new Map<number, StaffTelemetryReading>();
  const trayIds = [...new Set(assignments.map((item) => item.soilTrayId))];
  await Promise.all(trayIds.map(async (trayId) => {
    const pending = new Set(assignments.filter((item) => item.soilTrayId === trayId).map((item) => item.deviceId));
    for (let page = 1; pending.size; page++) {
      const history = await staffTelemetryService.history(trayId, { page, pageSize: 100 });
      for (const reading of history.items) {
        if (pending.has(reading.deviceId)) { readings.set(reading.deviceId, reading); pending.delete(reading.deviceId); }
      }
      if (page >= history.totalPages) break;
    }
  }));
  const trayById = new Map(trays.map((tray) => [tray.soilTrayId, tray]));
  const rackById = new Map(racks.map((rack) => [rack.rackId, rack]));
  const zoneById = new Map(zones.map((zone) => [zone.zoneId, zone]));
  const locations: MeasurementLocation[] = [];
  const environmentDevices: EnvironmentDevice[] = [];
  const measurements: Measurement[] = [];
  for (const device of devices) {
    const tray = trayById.get(assigned.get(device.deviceId) ?? -1);
    const rack = tray && rackById.get(tray.rackId);
    const zone = rack && zoneById.get(rack.zoneId);
    if (!tray || !rack || !zone) continue;
    const locationId = `tray-${tray.soilTrayId}`;
    if (!locations.some((location) => location.id === locationId)) locations.push({
      id: locationId, areaId: String(zone.zoneId), areaName: zone.zoneName,
      name: `${rack.rackCode} · ${tray.trayCode}`, kind: "shelf",
    });
    const reading = readings.get(device.deviceId);
    environmentDevices.push({
      id: device.deviceCode, name: device.deviceCode, locationId,
      connection: device.status === "ONLINE" ? "online" : "offline",
      lastReceived: reading?.recordedAt ?? device.lastSeen ?? new Date(0).toISOString(),
    });
    if (!reading) continue;
    for (const { key, metric, unit } of metrics) {
      const value = reading[key];
      if (typeof value !== "number") continue;
      measurements.push({
        id: `${reading.telemetryId}-${metric}`, deviceId: device.deviceCode,
        metric, value, unit, freshness: reading.isStale ? "stale" : "current",
        updatedAt: reading.recordedAt,
      });
    }
  }
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const deviceByCode = new Map(environmentDevices.map((device) => [device.id, device]));
  const visibleAlerts: LiveEnvironmentAlert[] = alerts.flatMap((alert) => {
    const device = devices.find((item) => item.deviceId === alert.deviceId);
    const location = device && deviceByCode.get(device.deviceCode) && locationById.get(deviceByCode.get(device.deviceCode)!.locationId);
    if (!device || !location) return [];
    return [{ id: String(alert.alertId), title: alert.message, deviceCode: device.deviceCode,
      location: `${location.areaName} · ${location.name}`,
      severity: /CRITICAL|HIGH|ERROR/i.test(alert.severity) ? "error" as const : "warning" as const,
      at: alert.createdAt }];
  });
  const areas: Area[] = zones.map((zone) => {
    const inventory = environmentDevices.filter((device) => locationById.get(device.locationId)?.areaId === String(zone.zoneId));
    const offline = inventory.filter((device) => device.connection === "offline");
    return { id: String(zone.zoneId), name: zone.zoneName, total: inventory.length,
      online: inventory.length - offline.length, offline: offline.length,
      stale: measurements.filter((measurement) => measurement.freshness === "stale" && inventory.some((device) => device.id === measurement.deviceId)).length,
      lastReceived: offline[0]?.lastReceived };
  });
  return { devices: environmentDevices, locations, measurements, alerts: visibleAlerts, areas };
}
