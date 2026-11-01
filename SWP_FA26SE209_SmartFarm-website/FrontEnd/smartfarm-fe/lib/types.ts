export type Area = string;
export type Stage = "Ươm mầm" | "Đang phát triển" | "Sẵn sàng thu hoạch";
export type Tray = {
  id: string;
  area: Area;
  customer: string;
  seed: string;
  sowed: string;
  harvest: string;
  stage: Stage;
  health: "Bình thường" | "Cần kiểm tra";
  orderId: string;
  cycle: string;
};
export type Device = {
  id: string;
  area: Area;
  online: boolean;
  received: string;
  temperature: number;
  humidity: number;
  light: number;
};
export type FarmAlert = {
  id: string;
  title: string;
  area: Area;
  device: string;
  reading: string;
  threshold?: string;
  detected: string;
  severity: "warning" | "error";
  status: "Chưa xử lý" | "Đang xử lý" | "Đã giải quyết";
  assignee: string;
  notes: string;
  description: string;
};
export type DeliveryBatch = {
  id: string;
  trayIds: string[];
  date: string;
  status: "Đang trồng" | "Chờ giao" | "Đã giao";
};
export type Payment =
  "Chờ thanh toán" | "Đã xác nhận" | "Đã hoàn tiền" | "Thanh toán thất bại";
type OrderBase = {
  id: string;
  customer: string;
  total: number;
  payment: Payment;
  status: "Chờ xử lý" | "Đang xử lý" | "Hoàn tất" | "Đã hủy";
  created: string;
};
export type Order = OrderBase &
  (
    | { kind: "rental"; trayIds: string[]; batches: DeliveryBatch[] }
    | {
        kind: "retail";
        products: { name: string; quantity: number; price: number }[];
        shipping: string;
      }
  );
export type Task = {
  id: string;
  time: string;
  title: string;
  area: Area;
  target: string;
  assignee: string;
  done: boolean;
};
export type Activity = { id: string; text: string; at: string };
