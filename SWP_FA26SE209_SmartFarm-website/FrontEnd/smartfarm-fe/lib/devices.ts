import {
  environmentDevices,
  environmentMeasurements,
  environmentLocations,
  environmentView,
  type Measurement,
  type Metric,
  type EnvironmentDevice,
  type MeasurementLocation,
  type EnvironmentArea,
} from "./environment";

export type DeviceConnection = "online" | "offline" | "unregistered";
export type ActuatorType = "pump" | "lamp" | "fan";
export type DeviceType = Metric | ActuatorType;
export type ReportedState = "on" | "off" | "unknown";
export type Controller = {
  id: string;
  area: string;
  connection: "online" | "offline";
};
export type Device = {
  id: string;
  name: string;
  group: "sensor" | "actuator";
  type: DeviceType;
  area: string;
  location: string;
  controllerId: string;
  connection: DeviceConnection;
  lastContact: string | null;
  reading?: Measurement;
  reported: ReportedState;
  automatic: boolean;
  notes: string;
  simulation: "success" | "failed" | "timeout";
};
export type CommandResult =
  "sending" | "waiting" | "success" | "failed" | "timeout";
export type DeviceCommand = {
  id: string;
  deviceId: string;
  requested: "on" | "off";
  source: string;
  at: string;
  result: CommandResult;
  duration?: number;
  message: string;
};
export const deviceTypes: Record<DeviceType, string> = {
  temperature: "Nhiệt độ",
  airHumidity: "Độ ẩm không khí",
  soilMoisture: "Độ ẩm đất",
  light: "Ánh sáng",
  waterLevel: "Mực nước",
  pump: "Máy bơm",
  lamp: "Đèn trồng",
  fan: "Quạt",
};
export const sensorTypes = [
  "temperature",
  "airHumidity",
  "soilMoisture",
  "light",
  "waterLevel",
] as const;
export const actuatorTypes = ["pump", "lamp", "fan"] as const;
export const controllers: Controller[] = [
  { id: "ESP32-A", area: "A", connection: "online" },
  { id: "ESP32-B", area: "B", connection: "online" },
  { id: "ESP32-C", area: "C", connection: "offline" },
];
export const deviceLocations: Record<string, string[]> = {
  A: ["Kệ 1", "Kệ 2", "Bồn chứa"],
  B: ["Kệ 1", "Kệ 2", "Bồn chứa"],
  C: ["Kệ 1", "Kệ 2", "Bồn chứa"],
};
const at = "2026-09-10T14:32:00+07:00";
const shared: Device[] = environmentDevices.map((d) => {
  const l = environmentLocations.find((l) => l.id === d.locationId)!;
  const reading = environmentMeasurements.find((m) => m.deviceId === d.id);
  return {
    id: d.id,
    name:
      d.id === "TB-A02"
        ? "Cảm biến độ ẩm không khí A1"
        : d.id === "TB-B03"
          ? "Cảm biến ánh sáng B1"
          : d.name,
    group: "sensor",
    type: reading?.metric ?? "light",
    area: l.areaId,
    location: l.name,
    controllerId: `ESP32-${l.areaId}`,
    connection: d.connection,
    lastContact: d.lastReceived,
    reading,
    reported: "unknown",
    automatic: false,
    notes: "",
    simulation: "success",
  };
});
const a05: Device = {
  ...shared[0],
  id: "TB-A05",
  name: "Cảm biến độ ẩm đất A2",
  type: "soilMoisture",
  location: "Kệ 2",
  lastContact: "2026-09-10T14:31:00+07:00",
  reading: {
    id: "M-A05",
    deviceId: "TB-A05",
    metric: "soilMoisture",
    value: 65,
    unit: "%",
    freshness: "current",
    updatedAt: "2026-09-10T14:31:00+07:00",
  },
};
const first = [
  "TB-A01",
  "TB-A02",
  "TB-A05",
  "TB-B03",
  "TB-B04",
  "TB-C02",
  "TB-C03",
];
const base = [...shared, a05];
const sensors: Device[] = [
  ...first.map((id) => base.find((d) => d.id === id)!),
  ...base.filter((d) => !first.includes(d.id)),
];
for (let i = 0; sensors.length < 28; i++) {
  const area = i % 2 ? "B" : "A",
    type = sensorTypes[i % 5],
    id = `TB-${area}${String(10 + i).padStart(2, "0")}`;
  sensors.push({
    ...a05,
    id,
    area,
    controllerId: `ESP32-${area}`,
    location: type === "waterLevel" ? "Bồn chứa" : "Kệ 2",
    name: `Cảm biến ${deviceTypes[type].toLocaleLowerCase("vi")} ${area}${i + 3}`,
    type,
    lastContact: at,
    reading: {
      id: `M-${id}`,
      deviceId: id,
      metric: type,
      value: [25, 70, 64, 10500, 80][i % 5],
      unit: type === "temperature" ? "°C" : type === "light" ? "lux" : "%",
      freshness: "current",
      updatedAt: at,
    },
  });
}
const actuators: Device[] = Array.from({ length: 12 }, (_, i) => {
  const area = i < 6 ? "A" : "B",
    type = actuatorTypes[i % 3];
  return {
    id: `DK-${area}${String(i + 1).padStart(2, "0")}`,
    name: `${deviceTypes[type]} ${area}${i + 1}`,
    group: "actuator",
    type,
    area,
    location: "Kệ 1",
    controllerId: `ESP32-${area}`,
    connection: "online",
    lastContact: at,
    reported: i === 5 ? "unknown" : i % 2 || i === 8 ? "on" : "off",
    automatic: i === 8,
    notes: "",
    simulation: i === 1 ? "failed" : i === 2 ? "timeout" : "success",
  };
});
// Preserve registered IDs when assigning the reference rule's readable names.
actuators.find((d) => d.id === "DK-B07")!.name = "Bơm nước tưới B1";
actuators.find((d) => d.id === "DK-A03")!.name = "Quạt thông gió A1";
const automationDevices: Device[] = [
  {
    ...shared[0],
    id: "TB-C05",
    name: "Cảm biến ánh sáng C1",
    type: "light",
    area: "C",
    location: "Kệ 1",
    controllerId: "ESP32-C",
    connection: "offline",
    lastContact: "2026-09-10T06:05:00+07:00",
    reading: {
      id: "M-C05",
      deviceId: "TB-C05",
      metric: "light",
      value: 6400,
      unit: "lux",
      freshness: "stale",
      updatedAt: "2026-09-10T06:05:00+07:00",
    },
  },
  {
    ...actuators[1],
    id: "DK-C01",
    name: "Đèn LED trồng cây C1",
    area: "C",
    controllerId: "ESP32-C",
    connection: "offline",
    lastContact: "2026-09-10T06:05:00+07:00",
    reported: "unknown",
    automatic: false,
    simulation: "success",
  },
];
export const initialDevices: Device[] = [
  ...sensors,
  ...actuators,
  ...automationDevices,
];
export const initialCommands: DeviceCommand[] = [
  {
    id: "LENH-001",
    deviceId: "DK-B09",
    requested: "on",
    source: "Quy tắc tự động",
    at,
    result: "success",
    message: "Thiết bị đã xác nhận.",
  },
];
export const resultLabels: Record<CommandResult, string> = {
  sending: "Đang gửi",
  waiting: "Chờ xác nhận",
  success: "Thành công",
  failed: "Thất bại",
  timeout: "Hết thời gian chờ",
};
export const stateLabels: Record<ReportedState, string> = {
  on: "Đang bật",
  off: "Đang tắt",
  unknown: "Chưa xác định",
};
export const normalizeDeviceText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
export function deviceSummary(devices: Device[]) {
  return {
    total: devices.length,
    online: devices.filter((d) => d.connection === "online").length,
    offline: devices.filter((d) => d.connection === "offline").length,
    unregistered: devices.filter((d) => d.connection === "unregistered").length,
    types: new Set(
      devices.filter((d) => d.group === "sensor").map((d) => d.type),
    ).size,
    controllers: new Set(devices.map((d) => d.controllerId)).size,
  };
}
export function deviceReading(d: Device) {
  if (d.group === "actuator") return stateLabels[d.reported];
  if (d.connection !== "online" || !d.reading) return "Không có dữ liệu";
  if (d.reading.levelState) return d.reading.levelState;
  if (d.reading.value === null) return "Không có dữ liệu";
  return `${d.reading.unit === "°C" ? d.reading.value : d.reading.value.toLocaleString("vi-VN")} ${d.reading.unit}`;
}
export function deviceTimestamp(value: string | null) {
  if (!value) return "Chưa liên lạc";
  const parts = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date(value));
  const p = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${p("day")}/${p("month")} ${p("hour")}:${p("minute")}`;
}
export type DeviceDraft = Pick<
  Device,
  | "name"
  | "id"
  | "group"
  | "type"
  | "area"
  | "location"
  | "controllerId"
  | "notes"
>;
export function validateDevice(d: DeviceDraft, inventory: Device[]) {
  const errors: Partial<Record<keyof DeviceDraft, string>> = {};
  if (!d.name.trim()) errors.name = "Vui lòng nhập tên thiết bị.";
  if (!d.id.trim()) errors.id = "Vui lòng nhập mã thiết bị.";
  else if (
    inventory.some(
      (x) => x.id.trim().toLowerCase() === d.id.trim().toLowerCase(),
    )
  )
    errors.id = "Mã thiết bị đã tồn tại.";
  if (
    !(
      d.group === "sensor"
        ? ([...sensorTypes] as string[])
        : ([...actuatorTypes] as string[])
    ).includes(d.type)
  )
    errors.type = "Loại thiết bị không phù hợp với nhóm.";
  if (!deviceLocations[d.area]) errors.area = "Vui lòng chọn khu vực.";
  if (!deviceLocations[d.area]?.includes(d.location))
    errors.location = "Vui lòng chọn vị trí hợp lệ.";
  if (!controllers.some((c) => c.id === d.controllerId && c.area === d.area))
    errors.controllerId = "Bộ điều khiển phải thuộc khu vực đã chọn.";
  return errors;
}
export function commandGuard(
  d: Device,
  commands: DeviceCommand[],
  duration?: number,
  requested?: "on" | "off",
) {
  if (d.group !== "actuator") return "Cảm biến chỉ hỗ trợ xem dữ liệu.";
  if (
    d.connection !== "online" ||
    controllers.find((c) => c.id === d.controllerId)?.connection !== "online"
  )
    return "Không thể điều khiển khi thiết bị hoặc bộ điều khiển mất kết nối.";
  if (
    commands.some(
      (c) => c.deviceId === d.id && ["sending", "waiting"].includes(c.result),
    )
  )
    return "Thiết bị đang có lệnh chờ xác nhận.";
  if (d.automatic)
    return "Thiết bị do quy tắc tự động quản lý. Chưa có quy tắc ghi đè thủ công; không thể gửi lệnh tại đây.";
  if (requested && d.reported === requested)
    return "Thiết bị đã ở trạng thái yêu cầu.";
  if (
    d.type === "pump" &&
    requested === "on" &&
    (!Number.isInteger(duration) || duration! < 1 || duration! > 300)
  )
    return "Thời gian chạy phải là số nguyên từ 1 đến 300 giây.";
  return "";
}
// The default environmental grid remains seven readings; inventory and deep links
// use the same registered devices as device management.
export function deviceEnvironmentView(
  inventory: Device[],
  area = "",
  device = "",
) {
  const sensors = inventory.filter((d) => d.group === "sensor");
  const sources = sensors.filter((d) => !area || d.area === area);
  const selected = sensors.find((d) => d.id === device);
  const original = environmentView(area, device);
  const measurements = device
    ? sources.filter((d) => d.id === device && d.reading).map((d) => d.reading!)
    : original.measurements;
  const counts = { current: 0, stale: 0, offline: 0 };
  for (const m of measurements) {
    const d = sensors.find((d) => d.id === m.deviceId)!;
    if (d.connection === "offline") counts.offline++;
    else if (d.connection === "online") counts[m.freshness]++;
  }
  const devices: EnvironmentDevice[] = sources.map((d) => ({
    id: d.id,
    name: d.name,
    locationId: `${d.area}-${d.location}`,
    connection: d.connection === "online" ? "online" : "offline",
    lastReceived: d.lastContact ?? "",
  }));
  const locations: MeasurementLocation[] = sources.map((d) => ({
    id: `${d.area}-${d.location}`,
    areaId: d.area as EnvironmentArea,
    areaName: `Khu ${d.area}`,
    name: d.location,
    kind: d.location === "Bồn chứa" ? "tank" : "shelf",
  }));
  const areas = (["A", "B", "C"] as const)
    .filter((a) => (!area || a === area) && (!selected || a === selected.area))
    .map((a) => {
      const all = sensors.filter((d) => d.area === a),
        offline = all.filter((d) => d.connection === "offline");
      return {
        id: a,
        name: `Khu ${a}`,
        total: all.length,
        online: all.filter((d) => d.connection === "online").length,
        offline: offline.length,
        lastReceived: offline[0]?.lastContact ?? undefined,
        stale: all.filter(
          (d) => d.connection === "online" && d.reading?.freshness === "stale",
        ).length,
      };
    });
  return { ...original, devices, locations, measurements, counts, areas };
}
