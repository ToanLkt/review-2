export type ConnectionStatus = "online" | "offline";
export type FreshnessStatus = "current" | "stale";
export type MeasurementStatus = FreshnessStatus | "offline";
export type EnvironmentArea = string;
export type MeasurementLocation = {
  id: string;
  areaId: EnvironmentArea;
  areaName: string;
  name: string;
  kind: "shelf" | "tank";
};
export type EnvironmentDevice = {
  id: string;
  name: string;
  locationId: string;
  connection: ConnectionStatus;
  lastReceived: string;
};
export type Metric =
  "temperature" | "airHumidity" | "soilMoisture" | "light" | "waterLevel";
export type Measurement = {
  id: string;
  deviceId: string;
  metric: Metric;
  value: number | null;
  unit: "°C" | "%" | "lux";
  freshness: FreshnessStatus;
  updatedAt: string;
  levelState?: string;
};
export type EnvironmentAlert = {
  id: string;
  title: string;
  deviceIds: string[];
  severity: "warning" | "error";
  at: string;
};
export const ENVIRONMENT_REFERENCE_TIME = "2026-09-10T14:32:00+07:00";
const received = (time: string) => `2026-09-10T${time}:00+07:00`;
export const environmentLocations: MeasurementLocation[] = [
  {
    id: "A-shelf-1",
    areaId: "A",
    areaName: "Khu A",
    name: "Kệ 1",
    kind: "shelf",
  },
  {
    id: "B-shelf-1",
    areaId: "B",
    areaName: "Khu B",
    name: "Kệ 1",
    kind: "shelf",
  },
  {
    id: "B-tank",
    areaId: "B",
    areaName: "Khu B",
    name: "Bồn chứa",
    kind: "tank",
  },
  {
    id: "C-shelf-2",
    areaId: "C",
    areaName: "Khu C",
    name: "Kệ 2",
    kind: "shelf",
  },
];
export const environmentDevices: EnvironmentDevice[] = [
  {
    id: "TB-A01",
    name: "Cảm biến nhiệt độ A1",
    locationId: "A-shelf-1",
    connection: "online",
    lastReceived: received("14:32"),
  },
  {
    id: "TB-A02",
    name: "Cảm biến độ ẩm KK A1",
    locationId: "A-shelf-1",
    connection: "online",
    lastReceived: received("14:32"),
  },
  {
    id: "TB-A03",
    name: "Cảm biến ánh sáng A1",
    locationId: "A-shelf-1",
    connection: "online",
    lastReceived: received("14:32"),
  },
  {
    id: "TB-B01",
    name: "Cảm biến độ ẩm đất B1",
    locationId: "B-shelf-1",
    connection: "online",
    lastReceived: received("14:05"),
  },
  {
    id: "TB-B03",
    name: "Cảm biến ánh sáng B3",
    locationId: "B-shelf-1",
    connection: "online",
    lastReceived: received("14:30"),
  },
  {
    id: "TB-B04",
    name: "Cảm biến mực nước bồn B",
    locationId: "B-tank",
    connection: "online",
    lastReceived: received("14:30"),
  },
  {
    id: "TB-C02",
    name: "Cảm biến nhiệt độ C2",
    locationId: "C-shelf-2",
    connection: "offline",
    lastReceived: received("11:45"),
  },
  {
    id: "TB-C03",
    name: "Cảm biến độ ẩm đất C2",
    locationId: "C-shelf-2",
    connection: "offline",
    lastReceived: received("11:45"),
  },
];
export const environmentMeasurements: Measurement[] = [
  {
    id: "M-A01",
    deviceId: "TB-A01",
    metric: "temperature",
    value: 24.5,
    unit: "°C",
    freshness: "current",
    updatedAt: received("14:32"),
  },
  {
    id: "M-A02",
    deviceId: "TB-A02",
    metric: "airHumidity",
    value: 72,
    unit: "%",
    freshness: "current",
    updatedAt: received("14:32"),
  },
  {
    id: "M-B01",
    deviceId: "TB-B01",
    metric: "soilMoisture",
    value: 38,
    unit: "%",
    freshness: "stale",
    updatedAt: received("14:05"),
  },
  {
    id: "M-B03",
    deviceId: "TB-B03",
    metric: "light",
    value: 11800,
    unit: "lux",
    freshness: "current",
    updatedAt: received("14:30"),
  },
  {
    id: "M-B04",
    deviceId: "TB-B04",
    metric: "waterLevel",
    value: 78,
    unit: "%",
    freshness: "current",
    updatedAt: received("14:30"),
  },
  {
    id: "M-C02",
    deviceId: "TB-C02",
    metric: "temperature",
    value: null,
    unit: "°C",
    freshness: "stale",
    updatedAt: received("11:45"),
  },
  {
    id: "M-C03",
    deviceId: "TB-C03",
    metric: "soilMoisture",
    value: null,
    unit: "%",
    freshness: "stale",
    updatedAt: received("11:45"),
  },
];
export const environmentAlerts: EnvironmentAlert[] = [
  {
    id: "ENV-01",
    title: "Độ ẩm đất chưa cập nhật",
    deviceIds: ["TB-B01"],
    severity: "warning",
    at: received("14:05"),
  },
  {
    id: "ENV-02",
    title: "Cảm biến mất kết nối",
    deviceIds: ["TB-C02", "TB-C03"],
    severity: "error",
    at: received("11:45"),
  },
];
export const metricLabels: Record<Metric, string> = {
  temperature: "Nhiệt độ",
  airHumidity: "Độ ẩm không khí",
  soilMoisture: "Độ ẩm đất",
  light: "Ánh sáng",
  waterLevel: "Mực nước bồn",
};
export const measurementStatus = (
  measurement: Measurement,
  device: EnvironmentDevice,
): MeasurementStatus =>
  device.connection === "offline" ? "offline" : measurement.freshness;
export const measurementValue = (
  measurement: Measurement,
  device: EnvironmentDevice,
) =>
  device.connection === "offline"
    ? "—"
    : (measurement.levelState ??
      (measurement.value === null
        ? "—"
        : `${new Intl.NumberFormat("vi-VN").format(measurement.value)} ${measurement.unit}`));
export function environmentView(areaId = "", deviceId = "") {
  const locationOf = (d: EnvironmentDevice) =>
    environmentLocations.find((l) => l.id === d.locationId)!;
  const devices = environmentDevices.filter(
    (d) => !areaId || locationOf(d).areaId === areaId,
  );
  const selectedDevice = devices.find((d) => d.id === deviceId);
  const visibleDevices = deviceId
    ? devices.filter((d) => d.id === deviceId)
    : devices;
  const ids = new Set(visibleDevices.map((d) => d.id));
  const measurements = environmentMeasurements.filter((m) =>
    ids.has(m.deviceId),
  );
  const counts = { current: 0, stale: 0, offline: 0 };
  for (const m of measurements)
    counts[
      measurementStatus(
        m,
        environmentDevices.find((d) => d.id === m.deviceId)!,
      )
    ]++;
  const alerts = environmentAlerts.flatMap((a) => {
    const deviceIds = a.deviceIds.filter((id) => ids.has(id));
    return deviceIds.length ? [{ ...a, deviceIds }] : [];
  });
  const areas = (["A", "B", "C"] as const)
    .filter(
      (a) =>
        (!areaId || a === areaId) &&
        (!selectedDevice || a === locationOf(selectedDevice).areaId),
    )
    .map((a) => {
      const inventory = environmentDevices.filter(
        (d) => locationOf(d).areaId === a,
      );
      const offline = inventory.filter((d) => d.connection === "offline");
      return {
        id: a,
        name: "Khu " + a,
        total: inventory.length,
        online: inventory.length - offline.length,
        offline: offline.length,
        lastReceived: offline[0]?.lastReceived,
        stale: environmentMeasurements.filter(
          (m) =>
            inventory.some(
              (d) => d.id === m.deviceId && d.connection === "online",
            ) && m.freshness === "stale",
        ).length,
      };
    });
  return { devices, measurements, counts, alerts, areas };
}
