import { cartLineTotal } from "@/lib/catalog";
import type { CartItem, Order } from "@/data/mock";

export type DemoPayment = { id: string; orderId: string; userId: string; status: "Pending" | "Paid" | "Failed" | "Expired"; amount: number; createdAt: string; method: "SePay QR"; address: string; items: CartItem[] };

export function paymentStatusLabel(status: DemoPayment["status"]): string {
  if (status === "Paid") return "Đã thanh toán";
  if (status === "Failed") return "Thanh toán thất bại";
  if (status === "Expired") return "Đã hết hạn";
  return "Đang chờ thanh toán";
}

export function paymentTypeLabel(payment: DemoPayment): string {
  const hasSeed = payment.items.some((item) => item.type === "seed");
  const hasTray = payment.items.some((item) => item.type === "tray");
  if (hasSeed && hasTray) return "Đơn hỗn hợp";
  return hasTray ? "Thuê khay" : "Hạt giống";
}

export function orderFromDemoPayment(payment: DemoPayment): Order {
  const hasSeed = payment.items.some((item) => item.type === "seed");
  const hasTray = payment.items.some((item) => item.type === "tray");
  return {
    id: payment.orderId, code: payment.orderId,
    kind: hasSeed && hasTray ? "Mixed" : hasTray ? "Tray Rental" : "Seed Product",
    status: "Đang xử lý", statusColor: "yellow",
    date: new Date(payment.createdAt).toLocaleDateString("vi-VN"), total: payment.amount,
    items: payment.items.map((item) => ({ name: item.name, qty: item.type === "tray" ? 1 : item.qty, price: item.type === "tray" ? cartLineTotal(item) : item.price })),
    payment: payment.method, address: payment.address,
  };
}
