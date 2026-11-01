import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  Grid2X2,
  LayoutDashboard,
  Leaf,
  Microchip,
  PackageCheck,
  Radio,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sprout,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export const navigation: { label: string; items: { label: string; path: string; icon: LucideIcon }[] }[] = [
  { label: "TỔNG QUAN", items: [{ label: "Dashboard", path: "dashboard", icon: LayoutDashboard }] },
  { label: "VẬN HÀNH", items: [
    { label: "Khu vực & khay trồng", path: "trays", icon: Grid2X2 },
    { label: "Canh tác", path: "products", icon: Leaf },
    { label: "Giống rau", path: "varieties", icon: Sprout },
    { label: "Kho", path: "inventory", icon: Warehouse },
    { label: "Giám sát môi trường", path: "iot", icon: Radio },
    { label: "Thiết bị IoT", path: "devices", icon: Microchip },
    { label: "Điều khiển tự động", path: "automation", icon: SlidersHorizontal },
  ] },
  { label: "KINH DOANH", items: [
    { label: "Đơn hàng", path: "orders", icon: PackageCheck },
    { label: "Thanh toán", path: "payments", icon: CreditCard },
    { label: "Giao hàng", path: "deliveries", icon: Truck },
  ] },
  { label: "QUẢN TRỊ", items: [
    { label: "Người dùng & phân quyền", path: "users", icon: Users },
    { label: "Lịch công việc", path: "tasks", icon: CalendarDays },
  ] },
  { label: "HỆ THỐNG", items: [
    { label: "Báo cáo & thống kê", path: "reports", icon: ChartNoAxesCombined },
    { label: "Thông báo", path: "notifications", icon: Bell },
    { label: "Cảnh báo", path: "alerts", icon: ShieldAlert },
    { label: "Cài đặt", path: "settings", icon: Settings },
  ] },
];
