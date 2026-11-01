import type {
  Area,
  Tray,
  Device,
  Order,
  FarmAlert,
  Task,
  Activity,
} from "./types";
import { capacities, NOW } from "./mock-data";
import type { DashboardDevice } from "./dashboard-live-data";
import { inRange } from "./formatters";
export function snapshot(
  trays: Tray[],
  devices: Device[],
  orders: Order[],
  area: string,
) {
  const capacity =
    area === "Tất cả khu vực"
      ? Object.values(capacities).reduce((a, b) => a + b, 0)
      : capacities[area as Area];
  const pending = orders.filter((o) => o.status === "Chờ xử lý");
  return {
    capacity,
    rented: trays.length,
    empty: capacity - trays.length,
    harvest: trays.filter(
      (t) => t.harvest >= NOW.slice(0, 10) && t.harvest <= "2026-09-18",
    ).length,
    online: devices.filter((d) => d.online).length,
    devices: devices.length,
    offline: devices.filter((d) => !d.online).length,
    pending: pending.length,
    rental: pending.filter((o) => o.kind === "rental").length,
    retail: pending.filter((o) => o.kind === "retail").length,
  };
}
export function filterTrays(trays: Tray[], query: string, stage: string) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase();
  return trays.filter(
    (t) =>
      (stage === "Tất cả giai đoạn" || t.stage === stage) &&
      normalize(t.id + " " + t.customer).includes(normalize(query)),
  );
}
export function filteredOrders(
  orders: Order[],
  tab: string,
  from?: Date,
  to?: Date,
) {
  return orders
    .filter(
      (o) => (tab === "all" || o.kind === tab) && inRange(o.created, from, to),
    )
    .sort((a, b) => b.created.localeCompare(a.created));
}
export function dashboardCsv(data: {
  source?: string;
  capturedAt?: string;
  area: string;
  period: string;
  trays: Tray[];
  devices: (Device | DashboardDevice)[];
  alerts: FarmAlert[];
  orders: Order[];
  tasks: Task[];
  activities: Activity[];
  metrics: ReturnType<typeof snapshot>;
}) {
  const rows: unknown[][] = [
    [`BÁO CÁO SMARTFARM · ${data.source ?? "DỮ LIỆU MÔ PHỎNG"}`],
    ["Khu vực vận hành", data.area],
    ["Khoảng ngày đơn hàng và hoạt động", data.period],
    ["Ảnh chụp trạng thái hiện tại", data.capturedAt ?? NOW],
    ["Khay đang thuê", data.metrics.rented],
    ["Tổng khay", data.metrics.capacity],
    ["Sắp thu hoạch", data.metrics.harvest],
    ["Thiết bị trực tuyến", data.metrics.online],
    ["Đơn chờ xử lý toàn nông trại", data.metrics.pending],
    [],
    ["KHAY TRỒNG · ÁP DỤNG TÌM KIẾM VÀ GIAI ĐOẠN"],
    [
      "Mã khay",
      "Khách hàng",
      "Loại rau",
      "Khu vực",
      "Ngày gieo",
      "Thu hoạch dự kiến",
      "Giai đoạn",
      "Tình trạng",
    ],
    ...data.trays.map((t) => [
      t.id,
      t.customer,
      t.seed,
      t.area,
      t.sowed,
      t.harvest,
      t.stage,
      t.health,
    ]),
    [],
    ["THIẾT BỊ"],
    [
      "Mã",
      "Khu vực",
      "Kết nối",
      "Nhiệt độ °C",
      "Độ ẩm %",
      "Ánh sáng lux",
      "Lần nhận cuối",
    ],
    ...data.devices.map((d) => [
      d.id,
      d.area,
      d.online ? "Trực tuyến" : "Mất kết nối",
      d.temperature,
      d.humidity,
      d.light,
      d.received,
    ]),
    [],
    ["CẢNH BÁO"],
    [
      "Mã",
      "Cảnh báo",
      "Khu vực",
      "Giá trị",
      "Trạng thái",
      "Phụ trách",
      "Ghi chú",
    ],
    ...data.alerts.map((a) => [
      a.id,
      a.title,
      a.area,
      a.reading,
      a.status,
      a.assignee,
      a.notes,
    ]),
    [],
    ["ĐƠN HÀNG · KHÔNG ÁP DỤNG KHU VỰC"],
    [
      "Mã",
      "Khách hàng",
      "Loại đơn",
      "Tổng tiền VND",
      "Thanh toán",
      "Trạng thái",
      "Ngày tạo",
    ],
    ...data.orders.map((o) => [
      o.id,
      o.customer,
      o.kind === "rental" ? "Thuê khay" : "Mua hạt giống",
      o.total,
      o.payment,
      o.status,
      o.created,
    ]),
    [],
    ["CÔNG VIỆC"],
    ["Mã", "Giờ", "Nội dung", "Khu vực", "Phụ trách", "Trạng thái"],
    ...data.tasks.map((t) => [
      t.id,
      t.time,
      t.title,
      t.area,
      t.assignee,
      t.done ? "Hoàn thành" : "Chờ thực hiện",
    ]),
    [],
    ["HOẠT ĐỘNG"],
    ["Thời điểm", "Nội dung"],
    ...data.activities.map((a) => [a.at, a.text]),
  ];
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const raw = String(cell ?? "");
            const safe = /^[=+@-]/.test(raw) ? "'" + raw : raw;
            return '"' + safe.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
