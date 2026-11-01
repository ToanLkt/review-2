export type UserDelivery = {
  userId?: string;
  id: string;
  orderCode: string;
  items: string;
  status: "Đang giao" | "Đã giao" | "Chờ xác nhận" | "Đã đặt lịch";
  expectedDate: string;
  address: string;
  note?: string;
};

export const userDeliveries: UserDelivery[] = [
  { id: "d1", orderCode: "ORD-2024-0128", items: "2 sản phẩm", status: "Chờ xác nhận", expectedDate: "31/01/2024 · 09:00–12:00", address: "25 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh" },
  { id: "d2", orderCode: "ORD-2024-0115", items: "2 sản phẩm", status: "Đang giao", expectedDate: "29/01/2024 · 14:00–17:00", address: "25 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh" },
  { id: "d3", orderCode: "ORD-2023-1220", items: "1 sản phẩm", status: "Đã giao", expectedDate: "22/12/2023 · 09:00–12:00", address: "25 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh" },
];
