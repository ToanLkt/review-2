import type { NotificationStatus, NotificationType } from "@/lib/api/staff/staff-notifications-service";

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  DRAFT: "Bản nháp", SCHEDULED: "Đã lên lịch", SENT: "Đã gửi",
};
export const notificationTypeLabels: Record<NotificationType, string> = {
  GENERAL: "Chung", ORDER: "Đơn hàng", PAYMENT: "Thanh toán", DELIVERY: "Giao hàng", GROWING_CYCLE: "Chu kỳ trồng",
};
export const notificationStatusLabel = (value: string) => notificationStatusLabels[value as NotificationStatus] ?? value;
export const notificationTypeLabel = (value: string) => notificationTypeLabels[value as NotificationType] ?? value;
export const notificationStatusClass = (value: string) => value === "SENT"
  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
  : value === "SCHEDULED"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
