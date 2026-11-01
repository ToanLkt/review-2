export type Seed = {
  id: string;
  name: string;
  shortDesc: string;
  description: string;
  price: number;
  unit: string;
  badge: string;
  badgeColor: "green" | "blue" | "red" | "purple";
  category: string;
  growDays: number;
  difficulty: "Dễ" | "Rất dễ" | "Trung bình";
  nutrition: string[];
  img: string;
};
export type Tray = {
  id: string;
  code: string;
  seedName: string;
  status: "Đang trồng" | "Nảy mầm" | "Sẵn thu hoạch";
  statusColor: string;
  location: string;
  temp: number;
  humidity: number;
  daysLeft: number;
  totalDays: number;
  lastUpdate: string;
  img: string;
};
export type OrderItem = { name: string; qty: number; price: number };
export type Order = {
  kind?: "Seed Product" | "Tray Rental" | "Mixed";
  id: string;
  code: string;
  status: "Đang xử lý" | "Hoàn thành" | "Đã hủy";
  statusColor: string;
  date: string;
  total: number;
  items: OrderItem[];
  payment: string;
  address: string;
};
export type Delivery = {
  id: string;
  orderCode: string;
  items: string;
  status: "Đang giao" | "Đã giao" | "Chờ xác nhận" | "Đã đặt lịch";
  statusColor: string;
  expectedDate: string;
  address: string;
};
export type NotificationItem = {
  id: string;
  type: "tray" | "payment" | "delivery" | "reminder";
  title: string;
  body: string;
  time: string;
  read: boolean;
};
export type CartItem = {
  id: string;
  type: "seed" | "tray";
  name: string;
  img: string;
  price: number;
  qty: number;
  duration?: number;
  seedId?: string;
};
export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatarInitial: string;
  activeTrays: number;
  totalOrders: number;
  memberSince: string;
};
const photo = (id: string) => `https://images.unsplash.com/${id}?w=1000&q=85`;
export const seeds: Seed[] = [
  {
    id: "sunflower",
    name: "Hướng Dương",
    shortDesc: "Giòn ngọt, hợp món salad",
    description:
      "Rau mầm hướng dương có vị bùi, giòn, dễ trồng và giàu dưỡng chất cho bữa ăn mỗi ngày.",
    price: 45000,
    unit: "gói 100g",
    badge: "Bán chạy",
    badgeColor: "green",
    category: "Oleaginous",
    growDays: 10,
    difficulty: "Rất dễ",
    nutrition: ["Vitamin E", "Protein", "Chất xơ"],
    img: photo("photo-1490750967868-88aa4486c946"),
  },
  {
    id: "pea",
    name: "Đậu Hà Lan",
    shortDesc: "Vị ngọt dịu, giàu protein",
    description:
      "Mầm đậu Hà Lan xanh tươi, vị ngọt dịu và thích hợp cho các món xào, salad.",
    price: 42000,
    unit: "gói 100g",
    badge: "Dễ trồng",
    badgeColor: "blue",
    category: "Legume",
    growDays: 12,
    difficulty: "Dễ",
    nutrition: ["Protein", "Vitamin C", "Sắt"],
    img: photo("photo-1542838132-92c53300491e"),
  },
  {
    id: "radish",
    name: "Củ Cải Đỏ",
    shortDesc: "Sắc đỏ và vị cay nhẹ",
    description:
      "Mầm củ cải đỏ có màu sắc nổi bật, vị hơi cay và hợp với món ăn tươi.",
    price: 39000,
    unit: "gói 100g",
    badge: "Nổi bật",
    badgeColor: "red",
    category: "Root",
    growDays: 8,
    difficulty: "Dễ",
    nutrition: ["Vitamin C", "Kali", "Chất xơ"],
    img: photo("photo-1598170845058-32b9d6a5da37"),
  },
  {
    id: "broccoli",
    name: "Broccoli",
    shortDesc: "Mầm xanh giàu dưỡng chất",
    description:
      "Mầm bông cải xanh giàu dinh dưỡng, phù hợp cho món salad và sinh tố xanh.",
    price: 52000,
    unit: "gói 100g",
    badge: "Dinh dưỡng",
    badgeColor: "purple",
    category: "Cruciferous",
    growDays: 9,
    difficulty: "Trung bình",
    nutrition: ["Vitamin K", "Vitamin C", "Sulforaphane"],
    img: photo("photo-1459411621453-7b03977f4bfc"),
  },
  {
    id: "mung",
    name: "Đậu Xanh",
    shortDesc: "Quen thuộc, dễ thu hoạch",
    description:
      "Giá đỗ từ đậu xanh dễ chăm sóc, tăng trưởng nhanh và hợp nhiều bữa ăn gia đình.",
    price: 32000,
    unit: "gói 100g",
    badge: "Phổ biến",
    badgeColor: "green",
    category: "Legume",
    growDays: 7,
    difficulty: "Rất dễ",
    nutrition: ["Protein", "Folate", "Chất xơ"],
    img: photo("photo-1540420773420-3366772f4999"),
  },
  {
    id: "wheat",
    name: "Lúa Mì",
    shortDesc: "Xanh mướt cho nước ép",
    description:
      "Cỏ lúa mì xanh non, thường dùng làm nước ép và phù hợp chăm sóc trong khay.",
    price: 35000,
    unit: "gói 100g",
    badge: "Tươi mới",
    badgeColor: "blue",
    category: "Cereal",
    growDays: 11,
    difficulty: "Dễ",
    nutrition: ["Diệp lục", "Vitamin A", "Khoáng chất"],
    img: photo("photo-1466692476868-aef1dfb1e735"),
  },
];
export const rentalPricing = {
  basePrice: 350000,
  discounts: [
    { min: 1, max: 2, pct: 0, label: "1–2 khay" },
    { min: 3, max: 5, pct: 5, label: "3–5 khay" },
    { min: 6, max: 9, pct: 10, label: "6–9 khay" },
    { min: 10, pct: 15, label: "10+ khay" },
  ],
};
export const trays: Tray[] = [
  {
    id: "tray-024",
    code: "KH-024",
    seedName: "Hướng Dương",
    status: "Đang trồng",
    statusColor: "green",
    location: "Khu A · Tầng 2",
    temp: 26.4,
    humidity: 72,
    daysLeft: 3,
    totalDays: 10,
    lastUpdate: "2 phút trước",
    img: photo("photo-1542838132-92c53300491e"),
  },
  {
    id: "tray-031",
    code: "KH-031",
    seedName: "Đậu Hà Lan",
    status: "Nảy mầm",
    statusColor: "blue",
    location: "Khu B · Tầng 1",
    temp: 25.8,
    humidity: 69,
    daysLeft: 7,
    totalDays: 12,
    lastUpdate: "5 phút trước",
    img: photo("photo-1466692476868-aef1dfb1e735"),
  },
  {
    id: "tray-018",
    code: "KH-018",
    seedName: "Củ Cải Đỏ",
    status: "Sẵn thu hoạch",
    statusColor: "yellow",
    location: "Khu A · Tầng 1",
    temp: 27.1,
    humidity: 68,
    daysLeft: 0,
    totalDays: 8,
    lastUpdate: "1 phút trước",
    img: photo("photo-1598170845058-32b9d6a5da37"),
  },
];
export const orders: Order[] = [
  {
    id: "order-108",
    kind: "Mixed",
    code: "DH-108",
    status: "Đang xử lý",
    statusColor: "yellow",
    date: "15/09/2026",
    total: 395000,
    items: [
      { name: "Thuê khay Hướng Dương · 1 tháng", qty: 1, price: 350000 },
      { name: "Hạt giống Hướng Dương", qty: 1, price: 45000 },
    ],
    payment: "Chuyển khoản ngân hàng",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
  {
    id: "order-102",
    kind: "Seed Product",
    code: "DH-102",
    status: "Hoàn thành",
    statusColor: "green",
    date: "10/09/2026",
    total: 84000,
    items: [{ name: "Hạt giống Đậu Hà Lan", qty: 2, price: 42000 }],
    payment: "Thanh toán khi nhận hàng",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
  {
    id: "order-096",
    kind: "Tray Rental",
    code: "DH-096",
    status: "Đã hủy",
    statusColor: "red",
    date: "01/09/2026",
    total: 350000,
    items: [{ name: "Thuê khay Đậu Xanh · 1 tháng", qty: 1, price: 350000 }],
    payment: "Ví điện tử",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
];
export const deliveries: Delivery[] = [
  {
    id: "delivery-1",
    orderCode: "DH-108",
    items: "Khay Hướng Dương, hạt giống",
    status: "Chờ xác nhận",
    statusColor: "yellow",
    expectedDate: "22/09/2026",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
  {
    id: "delivery-2",
    orderCode: "DH-102",
    items: "2 gói Đậu Hà Lan",
    status: "Đang giao",
    statusColor: "blue",
    expectedDate: "20/09/2026",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
];
export const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "tray",
    title: "Khay sắp thu hoạch",
    body: "Khay KH-024 còn 3 ngày đến kỳ thu hoạch.",
    time: "10 phút trước",
    read: false,
  },
  {
    id: "n2",
    type: "payment",
    title: "Thanh toán đã ghi nhận",
    body: "Đơn DH-108 đã được tiếp nhận.",
    time: "Hôm nay",
    read: false,
  },
  {
    id: "n3",
    type: "delivery",
    title: "Xác nhận lịch giao",
    body: "Vui lòng xác nhận lịch giao cho đơn DH-108.",
    time: "Hôm qua",
    read: false,
  },
  {
    id: "n4",
    type: "reminder",
    title: "Mẹo chăm sóc rau mầm",
    body: "Giữ độ ẩm ổn định để rau phát triển đều.",
    time: "17/09/2026",
    read: true,
  },
];
export const initialProfile: UserProfile = {
  name: "Minh Anh",
  email: "user@smartfarm.vn",
  phone: "0901234567",
  address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  avatarInitial: "MA",
  activeTrays: 3,
  totalOrders: 3,
  memberSince: "09/2026",
};
