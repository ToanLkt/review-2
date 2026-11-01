export function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")}₫`;
}

export function displayValue(value: string | null | undefined): string {
  return value?.trim() || "Chưa có thông tin";
}

const customerTimeZone = "Asia/Ho_Chi_Minh";

export function parseBackendDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  // ASP.NET/MySQL can serialize a UTC DateTime without `Z`. Browsers otherwise
  // read that form as local time and make deadlines appear seven hours early.
  const normalized = typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,7})?)?$/.test(value)
    ? `${value}Z`
    : value;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateParts(date: Date) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: customerTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
}

export function formatCustomerDate(value: string | Date | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "Chưa có thông tin";
  const parts = dateParts(date);
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatCustomerDateTime(value: string | Date | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "Chưa có thông tin";
  const parts = dateParts(date);
  return `${parts.hour}:${parts.minute} ${parts.day}/${parts.month}/${parts.year}`;
}

export function toCustomerDateTimeInput(value: string | Date | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "";
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function cropStatusLabel(status: string | null | undefined): string {
  const normalized = status?.trim().toUpperCase();
  const labels: Record<string, string> = {
    UNALLOCATED: "Chưa được xếp khay",
    ALLOCATED: "Đã xếp khay",
    PLANTED: "Đã gieo trồng",
    GERMINATING: "Đang nảy mầm",
    GROWING: "Đang phát triển",
    READY_TO_HARVEST: "Sẵn sàng thu hoạch",
    HARVESTED: "Đã thu hoạch",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    FAILED: "Không thành công",
  };
  return normalized ? labels[normalized] ?? "Đang cập nhật" : "Chưa cập nhật";
}

export function deliveryStatusLabel(status: string | null | undefined): string {
  const normalized = status?.trim().toUpperCase();
  const labels: Record<string, string> = {
    PENDING: "Đang chờ xử lý",
    SCHEDULED: "Đã lên lịch",
    PACKAGED: "Đã đóng gói",
    PROCESSING: "Đang xử lý",
    SHIPPING: "Đang giao",
    DELIVERING: "Đang giao",
    DELIVERED: "Đã giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    FAILED: "Không thành công",
  };
  return normalized ? labels[normalized] ?? "Đang cập nhật" : "Chưa cập nhật";
}

export function notificationTypeLabel(type: string | null | undefined): string {
  const normalized = type?.trim().toUpperCase();
  const labels: Record<string, string> = {
    GENERAL: "Thông báo chung",
    ORDER: "Đơn hàng",
    PAYMENT: "Thanh toán",
    DELIVERY: "Giao hàng",
    RENTAL: "Đơn thuê khay",
    CULTIVATION: "Quá trình trồng rau",
    HARVEST: "Thu hoạch",
    ALERT: "Cảnh báo",
  };
  return normalized ? labels[normalized] ?? "Thông báo" : "Thông báo";
}

export function orderItemTypeLabel(type: string | null | undefined): string {
  const normalized = type?.trim().toUpperCase();
  if (normalized === "SEED_PACKET" || normalized === "SEED") return "Hạt giống";
  if (normalized === "TRAY_RENTAL" || normalized === "RENTAL") return "Thuê khay";
  return "Sản phẩm";
}
