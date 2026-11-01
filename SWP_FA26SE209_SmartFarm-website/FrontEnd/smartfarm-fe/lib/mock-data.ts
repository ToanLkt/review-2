import type {
  Area,
  Tray,
  Device,
  FarmAlert,
  Order,
  Task,
  Activity,
} from "./types";
export const NOW = "2026-09-15T09:30:00+07:00";
export const areas: Area[] = ["Khu A", "Khu B", "Khu C"];
export const capacities: Record<Area, number> = {
  "Khu A": 16,
  "Khu B": 12,
  "Khu C": 12,
};
const customers = [
  "Nguyễn Hoàng Anh",
  "Trần Minh Anh",
  "Lê Thu Hà",
  "Phạm Quốc Bảo",
  "Đỗ Ngọc Mai",
  "Vũ Thanh Tùng",
  "Nguyễn Lan Chi",
];
export const trays: Tray[] = Array.from({ length: 32 }, (_, i) => {
  const area = areas[i < 14 ? 0 : i < 24 ? 1 : 2];
  const n = i < 14 ? i + 1 : i < 24 ? i - 13 : i - 23;
  return {
    id: `KH-${area.slice(-1)}${String(n).padStart(2, "0")}`,
    area,
    customer: customers[i % 7],
    seed: ["Cải củ đỏ", "Đậu Hà Lan", "Hướng dương", "Cải xanh"][i % 4],
    sowed: `2026-09-${i < 6 ? "08" : "12"}`,
    harvest: `2026-09-${i < 6 ? String(15 + (i % 3)) : "22"}`,
    stage:
      i < 2 ? "Sẵn sàng thu hoạch" : i < 20 ? "Đang phát triển" : "Ươm mầm",
    health: i === 14 || i === 24 ? "Cần kiểm tra" : "Bình thường",
    orderId: `DH-${101 + (i % 7)}`,
    cycle: `CK-2609-${String(i + 1).padStart(2, "0")}`,
  };
});
export const devices: Device[] = Array.from({ length: 20 }, (_, i) => ({
  id: `CB-${String(i + 1).padStart(2, "0")}`,
  area: areas[i < 8 ? 0 : i < 14 ? 1 : 2],
  online: i < 18,
  received: i < 18 ? NOW : "2026-09-15T07:45:00+07:00",
  temperature: i < 8 ? 24.5 : i < 14 ? 30.2 : 25.1,
  humidity: i < 8 ? 72 : i < 14 ? 68 : 74,
  light: i < 8 ? 8500 : i < 14 ? 9200 : 8100,
}));
export const initialAlerts: FarmAlert[] = [
  {
    id: "CB-001",
    title: "Nhiệt độ cao",
    area: "Khu B",
    device: "CB-09",
    reading: "30,2°C",
    threshold: "Trên 29°C",
    detected: "2026-09-15T09:15:00+07:00",
    severity: "error",
    status: "Chưa xử lý",
    assignee: "Chưa phân công",
    notes: "",
    description:
      "Nhiệt độ khu vực vượt ngưỡng cấu hình minh họa. Kiểm tra quạt thông gió và lịch chiếu sáng.",
  },
  {
    id: "CB-002",
    title: "Thiết bị mất kết nối",
    area: "Khu C",
    device: "CB-19, CB-20",
    reading: "2 cảm biến",
    detected: "2026-09-15T08:00:00+07:00",
    severity: "warning",
    status: "Chưa xử lý",
    assignee: "Chưa phân công",
    notes: "",
    description:
      "Chưa nhận được dữ liệu từ hai cảm biến kể từ 07:45. Kiểm tra nguồn điện và kết nối.",
  },
  {
    id: "CB-003",
    title: "Mực nước thấp",
    area: "Khu A",
    device: "Bồn nước số 1",
    reading: "18%",
    threshold: "Dưới 20%",
    detected: "2026-09-15T08:40:00+07:00",
    severity: "warning",
    status: "Chưa xử lý",
    assignee: "Minh Anh",
    notes: "Kiểm tra nguồn cấp nước.",
    description:
      "Mực nước dưới ngưỡng minh họa. Bổ sung nước trước chu kỳ tưới tiếp theo.",
  },
];
export const initialOrders: Order[] = Array.from({ length: 15 }, (_, i) => {
  const id = `DH-${101 + i}`;
  const common = {
    id,
    customer: customers[i % 7],
    total: i < 7 ? 480000 : 180000 + (i % 3) * 60000,
    payment: (i === 8
      ? "Chờ thanh toán"
      : i === 14
        ? "Đã hoàn tiền"
        : "Đã xác nhận") as Order["payment"],
    status: (i < 12
      ? "Chờ xử lý"
      : i === 14
        ? "Đã hủy"
        : "Hoàn tất") as Order["status"],
    created: `2026-09-${i < 7 ? "07" : String(15 - Math.floor(i / 3)).padStart(2, "0")}T08:30:00+07:00`,
  };
  if (i < 7) {
    const linked = trays.filter((t) => t.orderId === id);
    return {
      ...common,
      kind: "rental",
      trayIds: linked.map((t) => t.id),
      batches: [...new Set(linked.map((t) => t.harvest))].map((d, j) => ({
        id: `DG-${101 + i}-${j + 1}`,
        date: d,
        trayIds: linked.filter((t) => t.harvest === d).map((t) => t.id),
        status: "Đang trồng",
      })),
    };
  }
  return {
    ...common,
    kind: "retail",
    products: [
      {
        name: "Hạt cải củ đỏ · gói 100 g",
        quantity: common.total / 60000,
        price: 60000,
      },
    ],
    shipping: "Chờ bàn giao đơn vị vận chuyển",
  };
});
export const initialTasks: Task[] = [
  {
    id: "CV-01",
    time: "08:00",
    title: "Kiểm tra khay ươm khu A",
    area: "Khu A",
    target: "Khu A · 14 khay",
    assignee: "Minh Anh",
    done: true,
  },
  {
    id: "CV-02",
    time: "10:00",
    title: "Vệ sinh hệ thống tưới",
    area: "Khu B",
    target: "Hệ thống tưới khu B",
    assignee: "Quốc Bảo",
    done: false,
  },
  {
    id: "CV-03",
    time: "14:00",
    title: "Thu hoạch khay KH-A01",
    area: "Khu A",
    target: "KH-A01 · Cải củ đỏ",
    assignee: "Nguyễn Minh",
    done: false,
  },
  {
    id: "CV-04",
    time: "15:30",
    title: "Kiểm tra kết nối cảm biến",
    area: "Khu C",
    target: "CB-19, CB-20",
    assignee: "Thu Hà",
    done: false,
  },
];
export const initialActivities: Activity[] = [
  {
    id: "HD-01",
    text: "Hệ thống hoàn tất chu kỳ tưới khay KH-A02",
    at: "2026-09-15T09:20:00+07:00",
  },
  {
    id: "HD-02",
    text: "Minh Anh cập nhật nhật ký khay KH-B01",
    at: "2026-09-15T09:05:00+07:00",
  },
  {
    id: "HD-03",
    text: "Đơn mua hạt giống DH-108 đã được xác nhận thanh toán",
    at: "2026-09-15T08:30:00+07:00",
  },
  {
    id: "HD-04",
    text: "Nguyễn Minh bắt đầu chu kỳ trồng mới tại khu C",
    at: "2026-09-14T16:00:00+07:00",
  },
];
