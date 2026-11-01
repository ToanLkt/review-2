import type {
  StaffOrder,
  StaffOrderStatus,
  StaffOrderType,
} from "@/lib/api/staff/staff-orders-service";

export const orderStatusLabels: Record<StaffOrderStatus, string> = {
  AWAITING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn tất",
  EXPIRED: "Đã hết hạn",
};

export const orderTypeLabels: Record<StaffOrderType, string> = {
  TRAY_RENTAL: "Thuê khay",
  SEED_PACKET: "Mua hạt giống",
};

export const nextOrderStatus: Partial<Record<StaffOrderStatus, StaffOrderStatus>> = {
  AWAITING_PAYMENT: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "DELIVERING",
  DELIVERING: "COMPLETED",
};

export const orderStatusClass = (status: string) => {
  if (status === "AWAITING_PAYMENT") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "EXPIRED") return "border-red-200 bg-red-50 text-red-700";
  if (status === "DELIVERING") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export const orderStatusLabel = (status: string) =>
  orderStatusLabels[status as StaffOrderStatus] ?? status;

export const orderTypeLabel = (type: string) =>
  orderTypeLabels[type as StaffOrderType] ?? type;

export const orderSummary = (order: StaffOrder) => {
  if (order.items.length) {
    return order.items.map((item) => `${item.supplyName} × ${item.quantity}`).join(", ");
  }
  if (order.rentals.length) {
    return order.rentals.map((rental) => rental.trayCode).join(", ");
  }
  return "Chưa có dòng sản phẩm";
};
