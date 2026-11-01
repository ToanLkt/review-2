export const orderStatuses = [
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "PREPARING",
  "DELIVERING",
  "COMPLETED",
  "EXPIRED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderTypes = ["TRAY_RENTAL", "SEED_PACKET"] as const;
export type OrderType = (typeof orderTypes)[number];

export function normalizeOrderStatus(value: string | null | undefined): OrderStatus | null {
  const normalized = value?.trim().toUpperCase();
  return orderStatuses.find((status) => status === normalized) ?? null;
}

export function normalizeOrderType(value: string | null | undefined): OrderType | null {
  const normalized = value?.trim().toUpperCase();
  return orderTypes.find((type) => type === normalized) ?? null;
}

export function canPayOrder(status: string | null | undefined) {
  return normalizeOrderStatus(status) === "AWAITING_PAYMENT";
}

export function canScheduleOrderDelivery(status: string | null | undefined) {
  const normalized = normalizeOrderStatus(status);
  return normalized === "CONFIRMED" || normalized === "PREPARING";
}

export function orderStatusLabel(status: string | null | undefined) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "AWAITING_PAYMENT") return "Chờ thanh toán";
  if (normalized === "CONFIRMED") return "Đã xác nhận";
  if (normalized === "PREPARING") return "Đang chuẩn bị";
  if (normalized === "DELIVERING") return "Đang giao";
  if (normalized === "COMPLETED") return "Hoàn tất";
  if (normalized === "EXPIRED") return "Hết hạn";
  return status ? "Đang cập nhật" : "Chưa cập nhật";
}

export function orderStatusTone(status: string | null | undefined): "green" | "amber" | "red" | "blue" {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "COMPLETED") return "green";
  if (normalized === "AWAITING_PAYMENT") return "amber";
  if (normalized === "EXPIRED") return "red";
  return "blue";
}

export function orderTypeLabel(type: string | null | undefined) {
  const normalized = normalizeOrderType(type);
  if (normalized === "TRAY_RENTAL") return "Thuê khay";
  if (normalized === "SEED_PACKET") return "Gói hạt";
  return type ? "Đơn hàng" : "Chưa xác định";
}
