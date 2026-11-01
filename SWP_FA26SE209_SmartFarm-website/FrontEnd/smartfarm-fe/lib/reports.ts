export type ReportTab = "revenue" | "harvest" | "inventory";
export type OrderType = "Thuê khay" | "Mua hạt giống";
export type IoTSource = "Dữ liệu" | "Lệnh thủ công" | "Tự động cục bộ";
export type IoTResult = "Thành công" | "Dữ liệu cũ" | "Thất bại";

export type MonthlyRevenue = {
  month: "T4" | "T5" | "T6" | "T7" | "T8" | "T9";
  date: string;
  rental: number;
  retail: number;
};

export type PaymentTransaction = {
  id: string;
  orderId: string;
  type: OrderType;
  customer: string;
  date: string;
  amount: number;
};

export type HarvestRecord = {
  id: string;
  date: string;
  variety: string;
  tray: string;
  cycle: string;
  area: "Khu A" | "Khu B" | "Khu C";
  weight: number;
};

export type IoTLog = {
  id: string;
  device: string;
  source: IoTSource;
  time: string;
  event: string;
  action: string;
  result: IoTResult;
};

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: "T4", date: "2026-04-15", rental: 8.1, retail: 6.8 },
  { month: "T5", date: "2026-05-15", rental: 9.2, retail: 7.4 },
  { month: "T6", date: "2026-06-15", rental: 9.7, retail: 8.1 },
  { month: "T7", date: "2026-07-15", rental: 10.4, retail: 8.5 },
  { month: "T8", date: "2026-08-15", rental: 11.5, retail: 9.2 },
  { month: "T9", date: "2026-09-15", rental: 12.4, retail: 9.7 },
];

export const paymentTransactions: PaymentTransaction[] = [
  {
    id: "GD-5821",
    orderId: "DH-241",
    type: "Thuê khay",
    customer: "Nhà hàng Xanh",
    date: "2026-09-10",
    amount: 1680000,
  },
  {
    id: "GD-5820",
    orderId: "DH-239",
    type: "Thuê khay",
    customer: "Bếp ăn FPT",
    date: "2026-09-10",
    amount: 3240000,
  },
  {
    id: "GD-5818",
    orderId: "DH-237",
    type: "Thuê khay",
    customer: "Anh Dũng",
    date: "2026-09-09",
    amount: 560000,
  },
  {
    id: "GD-5815",
    orderId: "DH-233",
    type: "Mua hạt giống",
    customer: "Siêu thị GreenMart",
    date: "2026-09-08",
    amount: 2610000,
  },
  {
    id: "GD-5811",
    orderId: "DH-229",
    type: "Mua hạt giống",
    customer: "Chị Lan",
    date: "2026-09-07",
    amount: 455000,
  },
];

export const harvestRecords: HarvestRecord[] = [
  {
    id: "TH-118",
    date: "2026-09-10",
    variety: "Rau mầm cải xanh",
    tray: "K-A03",
    cycle: "CK-118",
    area: "Khu A",
    weight: 3.2,
  },
  {
    id: "TH-124",
    date: "2026-09-09",
    variety: "Rau mầm hướng dương",
    tray: "K-C02",
    cycle: "CK-124",
    area: "Khu C",
    weight: 4.1,
  },
  {
    id: "TH-121",
    date: "2026-09-09",
    variety: "Rau mầm củ cải",
    tray: "K-B07",
    cycle: "CK-121",
    area: "Khu B",
    weight: 2.8,
  },
  {
    id: "TH-115",
    date: "2026-09-08",
    variety: "Rau mầm cải xanh",
    tray: "K-A08",
    cycle: "CK-115",
    area: "Khu A",
    weight: 3.5,
  },
  {
    id: "TH-112",
    date: "2026-09-07",
    variety: "Rau mầm đậu Hà Lan",
    tray: "K-A11",
    cycle: "CK-112",
    area: "Khu A",
    weight: 2.6,
  },
  {
    id: "TH-109",
    date: "2026-09-06",
    variety: "Rau mầm hướng dương",
    tray: "K-C05",
    cycle: "CK-109",
    area: "Khu C",
    weight: 3.9,
  },
];

export const iotLogs: IoTLog[] = [
  {
    id: "LOG-901",
    device: "Cảm biến nhiệt A-01",
    source: "Dữ liệu",
    time: "2026-09-10T14:30",
    event: "Đo môi trường",
    action: "24,5°C",
    result: "Thành công",
  },
  {
    id: "LOG-900",
    device: "Máy bơm tưới A",
    source: "Lệnh thủ công",
    time: "2026-09-10T14:12",
    event: "Bật bơm",
    action: "Lệnh thủ công · Minh Anh",
    result: "Thành công",
  },
  {
    id: "LOG-899",
    device: "Quạt thông gió C",
    source: "Tự động cục bộ",
    time: "2026-09-10T13:58",
    event: "Bật quạt",
    action: "Tự động cục bộ · ngưỡng 26°C",
    result: "Thành công",
  },
  {
    id: "LOG-898",
    device: "Cảm biến ẩm B-04",
    source: "Dữ liệu",
    time: "2026-09-10T13:40",
    event: "Đo môi trường",
    action: "58% giá thể",
    result: "Dữ liệu cũ",
  },
  {
    id: "LOG-897",
    device: "Van dinh dưỡng 1",
    source: "Lệnh thủ công",
    time: "2026-09-10T13:15",
    event: "Mở van",
    action: "Lệnh thủ công · Hoàng Nam",
    result: "Thất bại",
  },
  {
    id: "LOG-896",
    device: "Đèn LED khu C",
    source: "Tự động cục bộ",
    time: "2026-09-10T06:00",
    event: "Bật đèn",
    action: "Tự động cục bộ · lịch chiếu sáng",
    result: "Thành công",
  },
];

export function inDateRange(date: string, from: string, to: string) {
  return (!from || date >= from) && (!to || date <= to);
}

export function revenueSummary(rows: MonthlyRevenue[], orderType = "") {
  const rental =
    orderType === "Mua hạt giống"
      ? 0
      : rows.reduce((sum, row) => sum + row.rental, 0);
  const retail =
    orderType === "Thuê khay"
      ? 0
      : rows.reduce((sum, row) => sum + row.retail, 0);
  return { rental, retail, total: rental + retail };
}

export function harvestSummary(rows: HarvestRecord[]) {
  const weight =
    Math.round(rows.reduce((sum, row) => sum + row.weight, 0) * 10) / 10;
  return {
    weight,
    count: rows.length,
    average: rows.length ? Math.floor((weight / rows.length) * 10) / 10 : 0,
  };
}

export function formatReportDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function reportCsv(tab: ReportTab, from = "", to = "") {
  const bom = "\uFEFF";
  if (tab === "revenue") {
    return (
      bom +
      [
        [
          "Mã giao dịch",
          "Đơn hàng",
          "Loại đơn",
          "Khách hàng",
          "Ngày",
          "Số tiền",
        ],
        ...paymentTransactions
          .filter((row) => inDateRange(row.date, from, to))
          .map((row) => [
            row.id,
            row.orderId,
            row.type,
            row.customer,
            formatReportDate(row.date),
            row.amount,
          ]),
      ]
        .map((row) => row.join(","))
        .join("\n")
    );
  }
  if (tab === "harvest") {
    return (
      bom +
      [
        [
          "Ngày thu hoạch",
          "Giống rau",
          "Khay",
          "Chu kỳ",
          "Khu vực",
          "Khối lượng (kg)",
        ],
        ...harvestRecords
          .filter((row) => inDateRange(row.date, from, to))
          .map((row) => [
            formatReportDate(row.date),
            row.variety,
            row.tray,
            row.cycle,
            row.area,
            row.weight,
          ]),
      ]
        .map((row) => row.join(","))
        .join("\n")
    );
  }
  return bom + "Nhóm vật tư,Số lượng có thể sử dụng";
}
