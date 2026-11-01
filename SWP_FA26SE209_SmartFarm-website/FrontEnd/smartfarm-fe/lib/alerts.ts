export type AlertStatus = "UNRESOLVED" | "IN_PROGRESS" | "RESOLVED";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertCategory =
  | "ENVIRONMENT"
  | "DEVICE"
  | "SYSTEM"
  | "WATER_LEVEL";

export type AlertArea = "Khu A" | "Khu B" | "Khu C";

export interface AlertHistoryEvent {
  id: string;
  at: string;
  label: string;
  actor?: string;
}

export interface SmartAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  area?: AlertArea;
  location: string;
  tray?: string;
  device?: string;
  value?: string;
  threshold?: string;
  source: string;
  detectedAt: string;
  assignedTo?: string;
  acceptedAt?: string;
  resolvedAt?: string;
  description: string;
  resolutionNote?: string;
  history: AlertHistoryEvent[];
}

export type AlertDatePreset = "today" | "7days" | "30days" | "custom";

export interface AlertFilters {
  search: string;
  severity: "ALL" | AlertSeverity;
  area: "ALL" | AlertArea;
  category: "ALL" | AlertCategory;
  date: AlertDatePreset;
  status: "ALL" | AlertStatus;
  from?: string;
  to?: string;
}

export const ALERT_REFERENCE_NOW = "2026-09-09T14:40:00+07:00";

const detected = (id: string, at: string): AlertHistoryEvent => ({
  id: `${id}-detected`,
  at,
  label: "Phát hiện cảnh báo",
  actor: "Hệ thống SmartFarm",
});

const primaryAlerts: SmartAlert[] = [
  {
    id: "ALT-028",
    title: "Độ ẩm giá thể thấp",
    severity: "WARNING",
    status: "UNRESOLVED",
    category: "ENVIRONMENT",
    area: "Khu B",
    location: "Khu B · Khay B-08",
    tray: "Khay B-08",
    device: "Cảm biến độ ẩm giá thể B-08",
    value: "38%",
    threshold: "< 40%",
    source: "Cảm biến độ ẩm giá thể",
    detectedAt: "2026-09-09T14:27:00+07:00",
    description:
      "Độ ẩm giá thể đã giảm xuống dưới ngưỡng cảnh báo được cấu hình cho Khu B.",
    history: [detected("ALT-028", "2026-09-09T14:27:00+07:00")],
  },
  {
    id: "ALT-027",
    title: "Thiết bị mất kết nối",
    severity: "CRITICAL",
    status: "UNRESOLVED",
    category: "DEVICE",
    area: "Khu C",
    location: "Khu C · 2 cảm biến (TB-C02, TB-C03)",
    device: "TB-C02, TB-C03",
    source: "Bộ giám sát kết nối ESP32-C",
    detectedAt: "2026-09-09T14:20:00+07:00",
    description:
      "Hai cảm biến tại Khu C đã ngừng gửi dữ liệu qua bộ điều khiển quản lý.",
    history: [detected("ALT-027", "2026-09-09T14:20:00+07:00")],
  },
  {
    id: "ALT-026",
    title: "Mực nước thấp",
    severity: "WARNING",
    status: "UNRESOLVED",
    category: "WATER_LEVEL",
    area: "Khu B",
    location: "Bồn dinh dưỡng 1 · Cảm biến mực nước N1",
    device: "Cảm biến mực nước N1",
    value: "22%",
    threshold: "< 25%",
    source: "Cảm biến mực nước",
    detectedAt: "2026-09-09T14:12:00+07:00",
    description:
      "Mực nước trong Bồn dinh dưỡng 1 đang thấp hơn ngưỡng vận hành được cấu hình.",
    history: [detected("ALT-026", "2026-09-09T14:12:00+07:00")],
  },
  {
    id: "ALT-025",
    title: "Thiết bị tưới hoạt động bất thường",
    severity: "CRITICAL",
    status: "IN_PROGRESS",
    category: "DEVICE",
    area: "Khu A",
    location: "Khu A · Bơm A-01",
    device: "Bơm A-01",
    source: "Bộ giám sát trạng thái thiết bị",
    detectedAt: "2026-09-09T13:58:00+07:00",
    assignedTo: "Minh Anh",
    acceptedAt: "2026-09-09T14:02:00+07:00",
    description:
      "Bơm A-01 không báo về trạng thái mong đợi sau lệnh tưới gần nhất.",
    history: [
      detected("ALT-025", "2026-09-09T13:58:00+07:00"),
      {
        id: "ALT-025-accepted",
        at: "2026-09-09T14:02:00+07:00",
        label: "Đã tiếp nhận cảnh báo",
        actor: "Minh Anh",
      },
    ],
  },
  {
    id: "ALT-024",
    title: "Nhiệt độ môi trường cao",
    severity: "WARNING",
    status: "IN_PROGRESS",
    category: "ENVIRONMENT",
    area: "Khu C",
    location: "Khu C · Khay C-05",
    tray: "Khay C-05",
    device: "Cảm biến nhiệt độ C-05",
    value: "30.2°C",
    threshold: "> 28°C",
    source: "Cảm biến nhiệt độ",
    detectedAt: "2026-09-09T13:42:00+07:00",
    assignedTo: "Hoàng Nam",
    acceptedAt: "2026-09-09T13:47:00+07:00",
    resolutionNote: "Đang kiểm tra hệ thống thông gió và điều kiện che sáng.",
    description:
      "Nhiệt độ môi trường quanh Khay C-05 đã vượt ngưỡng được cấu hình.",
    history: [
      detected("ALT-024", "2026-09-09T13:42:00+07:00"),
      {
        id: "ALT-024-accepted",
        at: "2026-09-09T13:47:00+07:00",
        label: "Đã tiếp nhận cảnh báo",
        actor: "Hoàng Nam",
      },
    ],
  },
];

const resolvedToday: SmartAlert[] = Array.from({ length: 8 }, (_, index) => {
  const number = 23 - index;
  const hour = 12 - index;
  const acceptedMinute = index % 2 === 0 ? 4 : 12;
  const resolvedMinute = acceptedMinute + 18;
  const id = `ALT-${String(number).padStart(3, "0")}`;
  const titles = [
    "Độ ẩm giá thể thấp",
    "Cường độ ánh sáng thấp hơn lịch",
    "Thông gió phản hồi chậm",
    "Mực nước đã được khôi phục",
  ];
  const areas: AlertArea[] = ["Khu A", "Khu B", "Khu C"];
  const area = areas[index % areas.length];
  const acceptedAt = `2026-09-09T${String(hour).padStart(2, "0")}:${String(acceptedMinute).padStart(2, "0")}:00+07:00`;
  const resolvedAt = `2026-09-09T${String(hour).padStart(2, "0")}:${String(resolvedMinute).padStart(2, "0")}:00+07:00`;
  const detectedAt = `2026-09-09T${String(hour).padStart(2, "0")}:00:00+07:00`;

  return {
    id,
    title: titles[index % titles.length],
    severity: index % 4 === 2 ? "INFO" : "WARNING",
    status: "RESOLVED",
    category: index % 4 === 2 ? "DEVICE" : "ENVIRONMENT",
    area,
    location: `${area} · Khay ${area.slice(-1)}-${String(index + 3).padStart(2, "0")}`,
    tray: `Khay ${area.slice(-1)}-${String(index + 3).padStart(2, "0")}`,
    device: `Cảm biến ${area.slice(-1)}-${String(index + 3).padStart(2, "0")}`,
    value: index % 2 === 0 ? "39%" : "7,600 lux",
    threshold: index % 2 === 0 ? "< 40%" : "< 8,000 lux",
    source: index % 2 === 0 ? "Cảm biến độ ẩm giá thể" : "Cảm biến ánh sáng",
    detectedAt,
    assignedTo: index % 2 === 0 ? "Hoàng Nam" : "Thanh Hà",
    acceptedAt,
    resolvedAt,
    description: "Điều kiện được ghi nhận cần được kiểm tra vận hành.",
    resolutionNote:
      index === 0
        ? "Đã bổ sung nước và kiểm tra cảm biến độ ẩm."
        : "Đã kiểm tra điều kiện vận hành và đưa chỉ số về phạm vi an toàn.",
    history: [
      detected(id, detectedAt),
      {
        id: `${id}-accepted`,
        at: acceptedAt,
        label: "Đã tiếp nhận cảnh báo",
        actor: index % 2 === 0 ? "Hoàng Nam" : "Thanh Hà",
      },
      {
        id: `${id}-resolved`,
        at: resolvedAt,
        label: "Đã giải quyết cảnh báo",
        actor: index % 2 === 0 ? "Hoàng Nam" : "Thanh Hà",
      },
    ],
  } satisfies SmartAlert;
});

const archivedAlerts: SmartAlert[] = Array.from({ length: 15 }, (_, index) => {
  const id = `ALT-${String(15 - index).padStart(3, "0")}`;
  const day = 8 - Math.floor(index / 3);
  const hour = 16 - (index % 3) * 2;
  const detectedAt = `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+07:00`;
  const acceptedAt = `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:05:00+07:00`;
  const resolvedAt = `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:23:00+07:00`;
  const area = (["Khu A", "Khu B", "Khu C"] as AlertArea[])[index % 3];
  const titles = [
    "Dữ liệu cảm biến gửi chậm",
    "Độ ẩm môi trường ngoài phạm vi",
    "Bộ điều khiển đã kết nối lại",
  ];
  return {
    id,
    title: titles[index % titles.length],
    severity: index % 3 === 2 ? "INFO" : "WARNING",
    status: "RESOLVED",
    category: index % 3 === 2 ? "SYSTEM" : "ENVIRONMENT",
    area,
    location: `${area} · Kệ ${index % 3 + 1}`,
    device: `TB-${area.slice(-1)}${String(index + 10).padStart(2, "0")}`,
    source: index % 3 === 2 ? "Sự kiện hệ thống" : "Cảm biến môi trường",
    detectedAt,
    assignedTo: "Nguyễn Minh",
    acceptedAt,
    resolvedAt,
    description: "Cảnh báo SmartFarm trong lịch sử được lưu để phục vụ rà soát vận hành.",
    resolutionNote: "Đã kiểm tra thiết bị và điều kiện tại khu vực.",
    history: [
      detected(id, detectedAt),
      {
        id: `${id}-accepted`,
        at: acceptedAt,
        label: "Đã tiếp nhận cảnh báo",
        actor: "Nguyễn Minh",
      },
      {
        id: `${id}-resolved`,
        at: resolvedAt,
        label: "Đã giải quyết cảnh báo",
        actor: "Nguyễn Minh",
      },
    ],
  } satisfies SmartAlert;
});

export const initialAlerts: SmartAlert[] = [
  ...primaryAlerts,
  ...resolvedToday,
  ...archivedAlerts,
];

export const severityLabel: Record<AlertSeverity, string> = {
  CRITICAL: "Nghiêm trọng",
  WARNING: "Cảnh báo",
  INFO: "Thông tin",
};

export const statusLabel: Record<AlertStatus, string> = {
  UNRESOLVED: "Chưa xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
};

export const categoryLabel: Record<AlertCategory, string> = {
  ENVIRONMENT: "Môi trường",
  DEVICE: "Thiết bị",
  SYSTEM: "Hệ thống",
  WATER_LEVEL: "Mực nước",
};

export function normalizeAlertText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function startOfReferenceDay() {
  return new Date("2026-09-09T00:00:00+07:00").getTime();
}

export function matchesAlertDate(
  alert: SmartAlert,
  preset: AlertDatePreset,
  from?: string,
  to?: string,
) {
  const value = new Date(alert.detectedAt).getTime();
  const end = new Date(ALERT_REFERENCE_NOW).getTime();
  if (preset === "custom") {
    const customStart = from
      ? new Date(`${from}T00:00:00+07:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const customEnd = to
      ? new Date(`${to}T23:59:59+07:00`).getTime()
      : Number.POSITIVE_INFINITY;
    return value >= customStart && value <= customEnd;
  }
  const start =
    preset === "today"
      ? startOfReferenceDay()
      : end - (preset === "7days" ? 7 : 30) * 24 * 60 * 60 * 1000;
  return value >= start && value <= end;
}

export function filterAlerts(
  alerts: SmartAlert[],
  tab: "UNRESOLVED" | "IN_PROGRESS" | "RESOLVED" | "ALL",
  filters: AlertFilters,
) {
  const search = normalizeAlertText(filters.search);
  return alerts.filter((alert) => {
    if (tab !== "ALL" && alert.status !== tab) return false;
    if (filters.status !== "ALL" && alert.status !== filters.status) return false;
    if (filters.severity !== "ALL" && alert.severity !== filters.severity)
      return false;
    if (filters.area !== "ALL" && alert.area !== filters.area) return false;
    if (filters.category !== "ALL" && alert.category !== filters.category)
      return false;
    if (!matchesAlertDate(alert, filters.date, filters.from, filters.to))
      return false;
    if (!search) return true;
    return normalizeAlertText(
      [
        alert.id,
        alert.title,
        alert.location,
        alert.tray,
        alert.device,
        alert.assignedTo,
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(search);
  });
}

export function isResolvedToday(alert: SmartAlert) {
  return (
    alert.status === "RESOLVED" &&
    Boolean(alert.resolvedAt) &&
    new Date(alert.resolvedAt!).getTime() >= startOfReferenceDay() &&
    new Date(alert.resolvedAt!).getTime() <=
      new Date(ALERT_REFERENCE_NOW).getTime()
  );
}

export function processingMinutes(alert: SmartAlert) {
  if (!alert.acceptedAt || !alert.resolvedAt) return undefined;
  return Math.round(
    (new Date(alert.resolvedAt).getTime() -
      new Date(alert.acceptedAt).getTime()) /
      60_000,
  );
}

export function formatAlertDate(value: string) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")}, ${part("day")}/${part("month")}/${part("year")}`;
}

export function formatAlertMoment(value?: string) {
  if (!value) return "—";
  return formatAlertDate(value).replace(", ", " · ");
}
