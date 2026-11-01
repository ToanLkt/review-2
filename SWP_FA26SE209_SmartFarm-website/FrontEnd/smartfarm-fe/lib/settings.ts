export type SettingsSection =
  | "farm"
  | "thresholds"
  | "sales"
  | "logs";

export interface FarmSettings {
  logo?: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  timezone: string;
  dateFormat: string;
}

export interface NotificationSettings {
  environmentAlert: boolean;
  deviceDisconnected: boolean;
  harvestReminder: boolean;
  newOrder: boolean;
  dailyEnvironmentEmail: boolean;
  disconnectedEmail: boolean;
  newOrderEmail: boolean;
}

export interface EnvironmentThresholds {
  variety: string;
  stage: string;
  temperatureMin: string;
  temperatureMax: string;
  airHumidityMin: string;
  airHumidityMax: string;
  substrateHumidityMin: string;
  substrateHumidityMax: string;
}

export interface SalesSettings {
  cod: boolean;
  bankTransfer: boolean;
  momo: boolean;
  vnpay: boolean;
  pickup: boolean;
  delivery: boolean;
  defaultDeliveryFee: string;
  freeDeliveryFrom: string;
  cutoffTime: string;
  returnPolicy: string;
  invoiceNote: string;
}

export interface LoginSession {
  id: string;
  device: string;
  location: string;
  time: string;
  current: boolean;
}

export type OperationAction =
  | "Cập nhật"
  | "Điều khiển"
  | "Đăng nhập"
  | "Tạo mới";

export interface OperationLog {
  id: string;
  occurredAt: string;
  displayTime: string;
  user: string;
  action: OperationAction;
  target: string;
  detail: string;
}

export const initialFarmSettings: FarmSettings = {
  name: "Nông trại trung tâm SmartFarm",
  address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
  email: "contact@smartfarm.vn",
  phone: "0901234567",
  timezone: "Asia/Ho_Chi_Minh (GMT+7)",
  dateFormat: "DD/MM/YYYY",
};

export const initialNotificationSettings: NotificationSettings = {
  environmentAlert: true,
  deviceDisconnected: true,
  harvestReminder: true,
  newOrder: true,
  dailyEnvironmentEmail: false,
  disconnectedEmail: true,
  newOrderEmail: true,
};

export const initialEnvironmentThresholds: EnvironmentThresholds = {
  variety: "Rau mầm cải xanh",
  stage: "Ươm mầm",
  temperatureMin: "18",
  temperatureMax: "28",
  airHumidityMin: "50",
  airHumidityMax: "85",
  substrateHumidityMin: "40",
  substrateHumidityMax: "75",
};

export const initialSalesSettings: SalesSettings = {
  cod: true,
  bankTransfer: true,
  momo: false,
  vnpay: false,
  pickup: true,
  delivery: true,
  defaultDeliveryFee: "30000",
  freeDeliveryFrom: "500000",
  cutoffTime: "16:00",
  returnPolicy:
    "Sản phẩm rau mầm tươi sống, không áp dụng đổi trả sau khi giao. Nếu sản phẩm hư hỏng do vận chuyển, liên hệ trong vòng 2 giờ sau nhận hàng để được hỗ trợ.",
  invoiceNote:
    "Cảm ơn quý khách đã tin tưởng sản phẩm SmartFarm. Bảo quản lạnh 2-5°C, dùng trong 5 ngày.",
};

export const initialLoginSessions: LoginSession[] = [
  {
    id: "SESSION-01",
    device: "Chrome · Windows 11",
    location: "TP.HCM, VN",
    time: "Hôm nay, 08:30",
    current: true,
  },
  {
    id: "SESSION-02",
    device: "Safari · iPhone 15",
    location: "TP.HCM, VN",
    time: "Hôm qua, 20:15",
    current: false,
  },
  {
    id: "SESSION-03",
    device: "Chrome · MacOS",
    location: "Hà Nội, VN",
    time: "07/09/2026, 14:22",
    current: false,
  },
];

export const operationLogs: OperationLog[] = [
  {
    id: "LOG-010",
    occurredAt: "2026-09-09T14:35:00+07:00",
    displayTime: "09/09/2026 14:35",
    user: "Nguyễn Minh",
    action: "Cập nhật",
    target: "Ngưỡng môi trường",
    detail: "Cập nhật ngưỡng độ ẩm giá thể",
  },
  {
    id: "LOG-009",
    occurredAt: "2026-09-09T13:20:00+07:00",
    displayTime: "09/09/2026 13:20",
    user: "Trần An",
    action: "Điều khiển",
    target: "Thiết bị IoT",
    detail: "Bật quạt thông gió",
  },
  {
    id: "LOG-008",
    occurredAt: "2026-09-09T11:42:00+07:00",
    displayTime: "09/09/2026 11:42",
    user: "Nguyễn Minh",
    action: "Cập nhật",
    target: "Cài đặt thông báo",
    detail: "Bật cảnh báo thiết bị mất kết nối",
  },
  {
    id: "LOG-007",
    occurredAt: "2026-09-09T09:10:00+07:00",
    displayTime: "09/09/2026 09:10",
    user: "Minh Anh",
    action: "Đăng nhập",
    target: "Tài khoản",
    detail: "Đăng nhập từ Chrome · Windows 11",
  },
  {
    id: "LOG-006",
    occurredAt: "2026-09-08T16:45:00+07:00",
    displayTime: "08/09/2026 16:45",
    user: "Nguyễn Minh",
    action: "Cập nhật",
    target: "Thông tin nông trại",
    detail: "Cập nhật số điện thoại liên hệ",
  },
  {
    id: "LOG-005",
    occurredAt: "2026-09-08T10:20:00+07:00",
    displayTime: "08/09/2026 10:20",
    user: "Trần An",
    action: "Tạo mới",
    target: "Quy tắc tự động",
    detail: "Tạo quy tắc tưới khu B",
  },
  {
    id: "LOG-004",
    occurredAt: "2026-09-07T14:22:00+07:00",
    displayTime: "07/09/2026 14:22",
    user: "Nguyễn Minh",
    action: "Cập nhật",
    target: "Cấu hình bán hàng",
    detail: "Cập nhật phí giao hàng mặc định",
  },
  {
    id: "LOG-003",
    occurredAt: "2026-09-05T08:05:00+07:00",
    displayTime: "05/09/2026 08:05",
    user: "Minh Anh",
    action: "Điều khiển",
    target: "Thiết bị IoT",
    detail: "Tắt bơm nước tưới B1",
  },
  {
    id: "LOG-002",
    occurredAt: "2026-08-28T15:30:00+07:00",
    displayTime: "28/08/2026 15:30",
    user: "Nguyễn Minh",
    action: "Cập nhật",
    target: "Bảo mật",
    detail: "Đổi mật khẩu quản trị viên",
  },
  {
    id: "LOG-001",
    occurredAt: "2026-08-15T10:00:00+07:00",
    displayTime: "15/08/2026 10:00",
    user: "Trần An",
    action: "Đăng nhập",
    target: "Tài khoản",
    detail: "Đăng nhập từ Safari · iPhone",
  },
];

export function normalizeSettingsText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function filterOperationLogs(
  logs: OperationLog[],
  filters: {
    search: string;
    user: string;
    action: string;
    period: "all" | "today" | "7days" | "30days";
  },
) {
  const search = normalizeSettingsText(filters.search);
  const reference = new Date("2026-09-09T23:59:59+07:00").getTime();
  const start =
    filters.period === "today"
      ? new Date("2026-09-09T00:00:00+07:00").getTime()
      : filters.period === "7days"
        ? reference - 7 * 86_400_000
        : filters.period === "30days"
          ? reference - 30 * 86_400_000
          : Number.NEGATIVE_INFINITY;

  return logs.filter((log) => {
    if (filters.user && log.user !== filters.user) return false;
    if (filters.action && log.action !== filters.action) return false;
    const occurredAt = new Date(log.occurredAt).getTime();
    if (occurredAt < start || occurredAt > reference) return false;
    if (!search) return true;
    return normalizeSettingsText(
      `${log.user} ${log.action} ${log.target} ${log.detail}`,
    ).includes(search);
  });
}

export function validatePasswordChange(values: {
  current: string;
  next: string;
  confirm: string;
}) {
  const errors: Partial<Record<keyof typeof values, string>> = {};
  if (!values.current) errors.current = "Vui lòng nhập mật khẩu hiện tại.";
  if (values.next.length < 8)
    errors.next = "Mật khẩu mới phải có ít nhất 8 ký tự.";
  if (values.next !== values.confirm)
    errors.confirm = "Mật khẩu xác nhận không khớp.";
  return errors;
}

export function validateThresholds(values: EnvironmentThresholds) {
  const pairs = [
    [values.temperatureMin, values.temperatureMax, "nhiệt độ"],
    [values.airHumidityMin, values.airHumidityMax, "độ ẩm không khí"],
    [values.substrateHumidityMin, values.substrateHumidityMax, "độ ẩm giá thể"],
  ] as const;
  for (const [min, max, label] of pairs) {
    if (!min || !max || Number.isNaN(Number(min)) || Number.isNaN(Number(max)))
      return `Vui lòng nhập ngưỡng ${label} hợp lệ.`;
    if (Number(min) >= Number(max))
      return `Ngưỡng tối thiểu của ${label} phải nhỏ hơn ngưỡng tối đa.`;
  }
  if (
    Number(values.airHumidityMin) < 0 ||
    Number(values.airHumidityMax) > 100 ||
    Number(values.substrateHumidityMin) < 0 ||
    Number(values.substrateHumidityMax) > 100
  )
    return "Ngưỡng độ ẩm phải nằm trong khoảng 0–100%.";
  return undefined;
}
