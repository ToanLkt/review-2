import type { DeliveryStatus } from "@/lib/api/staff/staff-deliveries-service";

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  PENDING: "Chờ đóng gói",
  PACKAGED: "Đã đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  FAILED: "Giao thất bại",
};

export const deliveryStatusLabel = (status: string) =>
  deliveryStatusLabels[status as DeliveryStatus] ?? status;

export const deliveryStatusClass = (status: string) => {
  if (status === "FAILED") return "border-red-200 bg-red-50 text-red-700";
  if (status === "DELIVERED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "SHIPPING") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

export const nextDeliveryStatus: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  PENDING: "PACKAGED",
  PACKAGED: "SHIPPING",
  SHIPPING: "DELIVERED",
};
