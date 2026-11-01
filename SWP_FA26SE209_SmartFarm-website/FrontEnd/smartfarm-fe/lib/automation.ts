import {
  controllers,
  deviceLocations,
  deviceTypes,
  initialDevices,
  type Device,
} from "./devices";

export type RuleConfig = {
  name: string;
  area: string;
  location: string;
  controllerId: string;
  sensorId: string;
  operator: "lt" | "gt";
  threshold: number;
  outputId: string;
  action: "on" | "off";
  duration: number | null;
  enabled: boolean;
};
export type SyncStatus =
  "draft" | "sending" | "waiting" | "acknowledged" | "failed" | "offline";
export type AutomationRule = {
  id: string;
  requested: RuleConfig;
  version: number;
  acknowledged: { config: RuleConfig; version: number } | null;
  status: SyncStatus;
  lastAttemptAt: string | null;
  lastAcknowledgedAt: string | null;
  inFlight: boolean;
  attempts: number;
  error?: string;
};
export type AutomationEvent = {
  id: string;
  ruleId: string;
  version: number;
  at: string;
  ruleName: string;
  controllerId: string;
  deviceId: string;
  deviceName: string;
  condition: string;
  action: string;
  result: "success" | "failed";
};
const time = (s: string) => `2026-09-10T${s}:00+07:00`;
const irrigation: RuleConfig = {
  name: "Tưới khu B theo độ ẩm đất",
  area: "B",
  location: "Kệ 1",
  controllerId: "ESP32-B",
  sensorId: "TB-B01",
  operator: "lt",
  threshold: 40,
  outputId: "DK-B07",
  action: "on",
  duration: 30,
  enabled: true,
};
const lighting: RuleConfig = {
  name: "Chiếu sáng khu C theo ánh sáng",
  area: "C",
  location: "Kệ 1",
  controllerId: "ESP32-C",
  sensorId: "TB-C05",
  operator: "lt",
  threshold: 8000,
  outputId: "DK-C01",
  action: "on",
  duration: null,
  enabled: true,
};
const ventilation: RuleConfig = {
  name: "Thông gió khu A theo nhiệt độ",
  area: "A",
  location: "Kệ 1",
  controllerId: "ESP32-A",
  sensorId: "TB-A01",
  operator: "gt",
  threshold: 28,
  outputId: "DK-A03",
  action: "on",
  duration: null,
  enabled: false,
};
export const initialRules: AutomationRule[] = [
  {
    id: "QT-001",
    requested: irrigation,
    version: 1,
    acknowledged: { config: { ...irrigation }, version: 1 },
    status: "acknowledged",
    lastAttemptAt: time("13:52"),
    lastAcknowledgedAt: time("13:52"),
    inFlight: false,
    attempts: 0,
  },
  {
    id: "QT-002",
    requested: lighting,
    version: 2,
    acknowledged: { config: { ...lighting, threshold: 7500 }, version: 1 },
    status: "sending",
    lastAttemptAt: time("14:20"),
    lastAcknowledgedAt: time("05:30"),
    inFlight: false,
    attempts: 0,
  },
  {
    id: "QT-003",
    requested: ventilation,
    version: 1,
    acknowledged: null,
    status: "draft",
    lastAttemptAt: null,
    lastAcknowledgedAt: null,
    inFlight: false,
    attempts: 0,
  },
];
export const automationHistory: AutomationEvent[] = [
  {
    id: "TD-001",
    ruleId: "QT-001",
    version: 1,
    at: time("14:20"),
    ruleName: irrigation.name,
    controllerId: "ESP32-B",
    deviceId: "DK-B07",
    deviceName: "Bơm nước tưới B1",
    condition: "Độ ẩm đất 38%",
    action: "Bật bơm 30 giây",
    result: "success",
  },
  {
    id: "TD-002",
    ruleId: "QT-001",
    version: 1,
    at: time("13:52"),
    ruleName: irrigation.name,
    controllerId: "ESP32-B",
    deviceId: "DK-B07",
    deviceName: "Bơm nước tưới B1",
    condition: "Độ ẩm đất 39%",
    action: "Bật bơm 30 giây",
    result: "success",
  },
  {
    id: "TD-003",
    ruleId: "QT-002",
    version: 1,
    at: time("06:05"),
    ruleName: lighting.name,
    controllerId: "ESP32-C",
    deviceId: "DK-C01",
    deviceName: "Đèn LED trồng cây C1",
    condition: "Ánh sáng 6.400 lux",
    action: "Bật đèn LED",
    result: "success",
  },
  {
    id: "TD-004",
    ruleId: "QT-002",
    version: 1,
    at: time("05:50"),
    ruleName: lighting.name,
    controllerId: "ESP32-C",
    deviceId: "DK-C01",
    deviceName: "Đèn LED trồng cây C1",
    condition: "Ánh sáng 7.100 lux",
    action: "Bật đèn LED",
    result: "failed",
  },
];
export const syncLabels: Record<SyncStatus, string> = {
  draft: "Bản nháp",
  sending: "Đang gửi cấu hình",
  waiting: "Đang chờ xác nhận",
  acknowledged: "Đã xác nhận",
  failed: "Gửi cấu hình thất bại",
  offline: "Chờ kết nối",
};
export function sensorUnit(sensor?: Device) {
  return sensor?.reading?.levelState
    ? null
    : (sensor?.reading?.unit ??
        (sensor?.type === "temperature"
          ? "°C"
          : sensor?.type === "light"
            ? "lux"
            : "%"));
}
export function thresholdText(c: RuleConfig, devices: Device[]) {
  const sensor = devices.find((d) => d.id === c.sensorId),
    unit = sensorUnit(sensor);
  return `${sensor ? deviceTypes[sensor.type] : "Chỉ số"} ${c.operator === "lt" ? "<" : ">"} ${c.threshold.toLocaleString("vi-VN")}${unit === "lux" ? " " : ""}${unit ?? ""}`;
}
export function actionText(c: RuleConfig, devices: Device[]) {
  const output = devices.find((d) => d.id === c.outputId);
  const verb = c.action === "on" ? "Bật" : "Tắt";
  return `${verb} ${output?.type === "pump" ? "bơm" : output?.type === "lamp" ? "đèn LED" : "quạt"}${output?.type === "pump" && c.action === "on" ? ` ${c.duration} giây` : ""}`;
}
export function validateRule(
  c: RuleConfig,
  devices: Device[],
  previous?: AutomationRule,
) {
  const errors: Partial<Record<keyof RuleConfig, string>> = {};
  const controller = controllers.find((d) => d.id === c.controllerId);
  const sensor = devices.find(
    (d) => d.id === c.sensorId && d.group === "sensor",
  );
  const output = devices.find(
    (d) => d.id === c.outputId && d.group === "actuator",
  );
  if (!c.name.trim()) errors.name = "Vui lòng nhập tên quy tắc.";
  if (!deviceLocations[c.area]) errors.area = "Vui lòng chọn khu vực.";
  if (!deviceLocations[c.area]?.includes(c.location))
    errors.location = "Vui lòng chọn vị trí hợp lệ.";
  if (!controller || controller.area !== c.area)
    errors.controllerId = "Bộ điều khiển phải thuộc khu vực đã chọn.";
  if (
    !sensor ||
    sensor.controllerId !== c.controllerId ||
    sensor.area !== c.area ||
    sensor.location !== c.location
  )
    errors.sensorId = "Chọn cảm biến đúng bộ điều khiển và vị trí.";
  if (sensor && sensorUnit(sensor) === null)
    errors.sensorId = "Cảm biến trạng thái không hỗ trợ ngưỡng số.";
  if (
    !output ||
    output.controllerId !== c.controllerId ||
    output.area !== c.area ||
    output.location !== c.location
  )
    errors.outputId = "Chọn thiết bị đầu ra đúng bộ điều khiển và vị trí.";
  if (!Number.isFinite(c.threshold))
    errors.threshold = "Vui lòng nhập ngưỡng dạng số.";
  else if (
    sensor &&
    sensorUnit(sensor) === "%" &&
    (c.threshold < 0 || c.threshold > 100)
  )
    errors.threshold = "Ngưỡng phần trăm phải từ 0 đến 100.";
  else if (sensor?.type === "light" && c.threshold < 0)
    errors.threshold = "Ngưỡng ánh sáng không được âm.";
  if (!["lt", "gt"].includes(c.operator))
    errors.operator = "Vui lòng chọn điều kiện so sánh.";
  if (!["on", "off"].includes(c.action))
    errors.action = "Vui lòng chọn hành động.";
  if (
    output?.type === "pump" &&
    c.action === "on" &&
    (!Number.isInteger(c.duration) || c.duration! < 1 || c.duration! > 300)
  )
    errors.duration = "Thời lượng bơm phải là số nguyên từ 1 đến 300 giây.";
  if (
    previous?.acknowledged &&
    (previous.acknowledged.config.controllerId !== c.controllerId ||
      previous.acknowledged.config.outputId !== c.outputId)
  )
    errors.outputId =
      "Quy tắc đang dùng cần giữ nguyên bộ điều khiển và thiết bị. Hãy tạo quy tắc khác nếu muốn thay đổi.";
  return errors;
}
export function saveRule(
  previous: AutomationRule | undefined,
  id: string,
  config: RuleConfig,
  mode: "draft" | "send",
  now: string,
): AutomationRule {
  if (previous?.inFlight) throw new Error("Quy tắc đang chờ xác nhận.");
  const online =
    controllers.find((c) => c.id === config.controllerId)?.connection ===
    "online";
  return {
    id,
    requested: { ...config, name: config.name.trim() },
    version: (previous?.version ?? 0) + 1,
    acknowledged: previous?.acknowledged ?? null,
    status: mode === "draft" ? "draft" : online ? "sending" : "offline",
    lastAttemptAt: mode === "send" ? now : (previous?.lastAttemptAt ?? null),
    lastAcknowledgedAt: previous?.lastAcknowledgedAt ?? null,
    inFlight: mode === "send" && online,
    attempts:
      mode === "send"
        ? (previous?.attempts ?? 0) + 1
        : (previous?.attempts ?? 0),
  };
}
export function retryRule(rule: AutomationRule, now: string): AutomationRule {
  if (rule.inFlight || !["failed", "offline"].includes(rule.status))
    throw new Error("Không thể gửi lại cấu hình ở trạng thái hiện tại.");
  const online =
    controllers.find((c) => c.id === rule.requested.controllerId)
      ?.connection === "online";
  return {
    ...rule,
    status: online ? "sending" : "offline",
    inFlight: online,
    attempts: rule.attempts + 1,
    lastAttemptAt: now,
    error: undefined,
  };
}
export function settleRule(
  rule: AutomationRule,
  version: number,
  outcome: "waiting" | "acknowledged" | "failed",
  now: string,
  error?: string,
): AutomationRule {
  if (!rule.inFlight || rule.version !== version) return rule;
  if (outcome === "waiting") return { ...rule, status: "waiting" };
  if (outcome === "failed")
    return { ...rule, status: "failed", inFlight: false, error };
  if (
    rule.status !== "waiting" ||
    controllers.find((c) => c.id === rule.requested.controllerId)
      ?.connection !== "online"
  )
    return rule;
  return {
    ...rule,
    status: "acknowledged",
    inFlight: false,
    acknowledged: { config: { ...rule.requested }, version },
    lastAcknowledgedAt: now,
    error: undefined,
  };
}
export function applyRuleOwnership(devices: Device[], rules: AutomationRule[]) {
  const managed = new Set(
    rules.flatMap((r) => [
      r.requested.outputId,
      ...(r.acknowledged ? [r.acknowledged.config.outputId] : []),
    ]),
  );
  return devices.map((d) =>
    managed.has(d.id)
      ? {
          ...d,
          // Existing automation outside this page is not disabled by a draft.
          automatic:
            !!initialDevices.find((original) => original.id === d.id)
              ?.automatic ||
            rules.some(
              (r) =>
                r.acknowledged?.config.outputId === d.id &&
                r.acknowledged.config.enabled,
            ),
        }
      : d,
  );
}
