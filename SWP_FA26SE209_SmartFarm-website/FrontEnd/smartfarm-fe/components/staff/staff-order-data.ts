export type StaffOrder = {
  id: string;
  customer: string;
  phone: string;
  address: string;
  payment: string;
  delivery: string;
  status: string;
  products: { name: string; quantity: number; unitPrice: number; unit: string; weightGrams: number }[];
};

export const staffOrders: StaffOrder[] = [
  {
    id: "ORD-1024",
    customer: "Nguyễn An",
    phone: "0901234567",
    address: "25 Nguyễn Huệ, Quận 1, TP.HCM",
    payment: "Đã thanh toán",
    delivery: "Giao tận nơi",
    status: "Chờ xử lý",
    products: [{ name: "Rau mầm cải xanh", quantity: 2, unitPrice: 60000, unit: "phần", weightGrams: 100 }],
  },
  {
    id: "ORD-1025",
    customer: "Trần Mai",
    phone: "Chưa cập nhật",
    address: "Nhận tại trại",
    payment: "Đã thanh toán",
    delivery: "Nhận tại trại",
    status: "Đang chuẩn bị",
    products: [{ name: "Rau mầm hướng dương", quantity: 3, unitPrice: 55000, unit: "phần", weightGrams: 100 }],
  },
  {
    id: "ORD-1026",
    customer: "Lê Hoàng",
    phone: "Chưa cập nhật",
    address: "Chưa cập nhật",
    payment: "Chờ thanh toán",
    delivery: "Giao tận nơi",
    status: "Sẵn sàng giao",
    products: [{ name: "Đậu Hà Lan", quantity: 2, unitPrice: 70000, unit: "phần", weightGrams: 100 }],
  },
];

export const staffOrderTotal = (order: StaffOrder) =>
  order.products.reduce((sum, product) => sum + product.quantity * product.unitPrice, 0);
