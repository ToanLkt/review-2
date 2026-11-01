export type UserNotification = {
  id: string;
  type: "tray" | "payment" | "delivery" | "reminder";
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export const userNotifications: UserNotification[] = [
  { id: "n1", type: "tray", title: "Khay rau đang phát triển tốt", body: "Khay TRY-2024-001 đã được cập nhật hình ảnh mới nhất.", time: "5 phút trước", read: false },
  { id: "n2", type: "delivery", title: "Xác nhận lịch giao hàng", body: "Đơn ORD-2024-0128 đang chờ bạn xác nhận lịch giao.", time: "2 giờ trước", read: false },
  { id: "n3", type: "payment", title: "Thanh toán thành công", body: "Thanh toán đơn ORD-2024-0115 đã được ghi nhận.", time: "Hôm qua", read: false },
  { id: "n4", type: "reminder", title: "Sắp đến ngày thu hoạch", body: "Khay rau mầm củ cải đỏ sẽ sẵn sàng thu hoạch trong hôm nay.", time: "2 ngày trước", read: true },
];
