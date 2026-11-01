// ---------------------------------------------------------------------------
// Material‑inventory data layer – types, mock data, helpers
// ---------------------------------------------------------------------------

/** Status derived from available vs threshold */
export type StockStatus = "Đủ dùng" | "Sắp hết" | "Hết hàng";

/** Transaction type */
export type TransactionType = "Nhập kho" | "Xuất dùng" | "Bán lẻ";

/** A warehouse material */
export interface Material {
  id: string;
  code: string;
  name: string;
  group: string;
  unit: string;
  stock: number;
  reserved: number;
  available: number;
  minThreshold: number;
  note: string;
}

/** Draft for updating material metadata (not computed quantities) */
export interface MaterialDraft {
  name: string;
  group: string;
  unit: string;
  minThreshold: number;
  note: string;
}

export type MaterialErrors = Partial<
  Record<keyof MaterialDraft | "form", string>
>;

/** A stock transaction */
export interface Transaction {
  id: string;
  code: string;
  type: TransactionType;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: string;
  performer: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const groups = [
  "Hạt giống",
  "Giá thể",
  "Bao bì",
  "Dinh dưỡng",
  "Vật tư tiêu hao",
  "Khác",
];

export const statusLabels: StockStatus[] = ["Đủ dùng", "Sắp hết", "Hết hàng"];

export const exportReasons = [
  "Gieo trồng lô LT-028",
  "Gieo trồng lô LT-029",
  "Thay giá thể khay K-012",
  "Vận hành chung",
  "Bảo trì định kỳ",
  "Khác",
];

export const performers = [
  "Nguyễn Minh",
  "Minh Anh",
  "Hoàng Nam",
  "Trần Hoa",
];

// ---------------------------------------------------------------------------
// Mock materials
// ---------------------------------------------------------------------------
export const initialMaterials: Material[] = [
  {
    id: "mat-1",
    code: "VT-001",
    name: "Hạt cải xanh",
    group: "Hạt giống",
    unit: "kg",
    stock: 8.5,
    reserved: 2,
    available: 6.5,
    minThreshold: 5,
    note: "Hạt giống cải xanh chất lượng cao, nhập từ Đà Lạt.",
  },
  {
    id: "mat-2",
    code: "VT-002",
    name: "Hạt củ cải",
    group: "Hạt giống",
    unit: "kg",
    stock: 3.2,
    reserved: 0.5,
    available: 2.7,
    minThreshold: 5,
    note: "",
  },
  {
    id: "mat-3",
    code: "VT-003",
    name: "Hạt hướng dương",
    group: "Hạt giống",
    unit: "kg",
    stock: 12,
    reserved: 1,
    available: 11,
    minThreshold: 5,
    note: "Hạt hướng dương đen, giống cao sản.",
  },
  {
    id: "mat-4",
    code: "VT-004",
    name: "Giá thể xơ dừa",
    group: "Giá thể",
    unit: "bao",
    stock: 6,
    reserved: 0,
    available: 6,
    minThreshold: 10,
    note: "Xơ dừa đã xử lý, 10 kg/bao.",
  },
  {
    id: "mat-5",
    code: "VT-005",
    name: "Giá thể perlite",
    group: "Giá thể",
    unit: "bao",
    stock: 15,
    reserved: 0,
    available: 15,
    minThreshold: 5,
    note: "",
  },
  {
    id: "mat-6",
    code: "VT-006",
    name: "Hộp đóng gói 50 g",
    group: "Bao bì",
    unit: "cái",
    stock: 320,
    reserved: 40,
    available: 280,
    minThreshold: 100,
    note: "Hộp giấy kraft in logo SmartFarm.",
  },
  {
    id: "mat-7",
    code: "VT-007",
    name: "Hộp đóng gói 100 g",
    group: "Bao bì",
    unit: "cái",
    stock: 0,
    reserved: 0,
    available: 0,
    minThreshold: 100,
    note: "Đã hết hàng — chờ nhập từ Cty Bao Bì Xanh.",
  },
  {
    id: "mat-8",
    code: "VT-008",
    name: "Dung dịch dinh dưỡng A",
    group: "Dinh dưỡng",
    unit: "lít",
    stock: 45,
    reserved: 5,
    available: 40,
    minThreshold: 20,
    note: "DD dinh dưỡng đa lượng cho rau mầm.",
  },
  {
    id: "mat-9",
    code: "VT-009",
    name: "Dung dịch dinh dưỡng B",
    group: "Dinh dưỡng",
    unit: "lít",
    stock: 8,
    reserved: 2,
    available: 6,
    minThreshold: 10,
    note: "",
  },
  {
    id: "mat-10",
    code: "VT-010",
    name: "Túi zip đựng hạt giống",
    group: "Bao bì",
    unit: "cái",
    stock: 1200,
    reserved: 0,
    available: 1200,
    minThreshold: 200,
    note: "",
  },
  {
    id: "mat-11",
    code: "VT-011",
    name: "Tem nhãn sản phẩm",
    group: "Vật tư tiêu hao",
    unit: "tờ",
    stock: 500,
    reserved: 0,
    available: 500,
    minThreshold: 100,
    note: "Tem in nhiệt, 50 nhãn/tờ.",
  },
  {
    id: "mat-12",
    code: "VT-012",
    name: "Hạt đậu Hà Lan",
    group: "Hạt giống",
    unit: "kg",
    stock: 4,
    reserved: 1.5,
    available: 2.5,
    minThreshold: 3,
    note: "",
  },
];

// ---------------------------------------------------------------------------
// Mock transactions
// ---------------------------------------------------------------------------
export const initialTransactions: Transaction[] = [
  {
    id: "tx-1",
    code: "PX-042",
    type: "Xuất dùng",
    materialId: "mat-1",
    materialName: "Hạt cải xanh",
    quantity: -0.5,
    unit: "kg",
    reason: "Gieo trồng lô LT-028",
    performer: "Minh Anh",
    date: "2026-09-09",
  },
  {
    id: "tx-2",
    code: "BH-118",
    type: "Bán lẻ",
    materialId: "mat-1",
    materialName: "Hạt giống cải xanh · Gói 50g",
    quantity: -4,
    unit: "gói",
    reason: "Bàn giao đơn P002 (tự động)",
    performer: "—",
    date: "2026-09-09",
  },
  {
    id: "tx-3",
    code: "PN-031",
    type: "Nhập kho",
    materialId: "mat-7",
    materialName: "Hộp đóng gói 100 g",
    quantity: 500,
    unit: "cái",
    reason: "Cty Bao Bì Xanh",
    performer: "Hoàng Nam",
    date: "2026-09-08",
  },
  {
    id: "tx-4",
    code: "PX-041",
    type: "Xuất dùng",
    materialId: "mat-8",
    materialName: "Dung dịch dinh dưỡng A",
    quantity: -15,
    unit: "lít",
    reason: "Vận hành chung",
    performer: "Minh Anh",
    date: "2026-09-07",
  },
  {
    id: "tx-5",
    code: "PN-030",
    type: "Nhập kho",
    materialId: "mat-3",
    materialName: "Hạt hướng dương",
    quantity: 10,
    unit: "kg",
    reason: "Cty Hạt Giống Vàng",
    performer: "Hoàng Nam",
    date: "2026-09-06",
  },
  {
    id: "tx-6",
    code: "PX-040",
    type: "Xuất dùng",
    materialId: "mat-4",
    materialName: "Giá thể xơ dừa",
    quantity: -2,
    unit: "bao",
    reason: "Thay giá thể khay K-012",
    performer: "Trần Hoa",
    date: "2026-09-05",
  },
  {
    id: "tx-7",
    code: "PN-029",
    type: "Nhập kho",
    materialId: "mat-1",
    materialName: "Hạt cải xanh",
    quantity: 5,
    unit: "kg",
    reason: "Cty Hạt Giống Đà Lạt",
    performer: "Nguyễn Minh",
    date: "2026-09-04",
  },
  {
    id: "tx-8",
    code: "BH-117",
    type: "Bán lẻ",
    materialId: "mat-12",
    materialName: "Hạt giống đậu Hà Lan · Gói 100g",
    quantity: -2,
    unit: "gói",
    reason: "Bàn giao đơn P001 (tự động)",
    performer: "—",
    date: "2026-09-03",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();

export function stockStatus(m: Material): StockStatus {
  if (m.available <= 0) return "Hết hàng";
  if (m.available <= m.minThreshold) return "Sắp hết";
  return "Đủ dùng";
}

export function filterMaterials(
  materials: Material[],
  query: string,
  group: string,
  status: string,
): Material[] {
  const q = norm(query);
  return materials.filter(
    (m) =>
      (!q || norm(m.name + " " + m.code).includes(q)) &&
      (!group || m.group === group) &&
      (!status || stockStatus(m) === status),
  );
}

export function filterTransactions(
  txs: Transaction[],
  query: string,
  group: string,
  typeFilter: string,
): Transaction[] {
  const q = norm(query);
  return txs.filter(
    (t) =>
      (!q || norm(t.materialName + " " + t.code).includes(q)) &&
      (!group || group === t.type) &&
      (!typeFilter || t.type === typeFilter),
  );
}

export function inventorySummary(materials: Material[]) {
  const totalTypes = materials.length;
  const uniqueGroups = new Set(materials.map((m) => m.group)).size;
  const low = materials.filter((m) => stockStatus(m) === "Sắp hết").length;
  const out = materials.filter((m) => stockStatus(m) === "Hết hàng").length;
  return { totalTypes, uniqueGroups, low, out };
}

export function validateMaterial(draft: MaterialDraft): MaterialErrors {
  const errors: MaterialErrors = {};
  if (!draft.name.trim()) errors.name = "Tên vật tư là bắt buộc.";
  if (!draft.group) errors.group = "Vui lòng chọn nhóm vật tư.";
  if (!draft.unit.trim()) errors.unit = "Đơn vị là bắt buộc.";
  if (draft.minThreshold < 0)
    errors.minThreshold = "Ngưỡng tối thiểu không được âm.";
  return errors;
}

export interface ImportExportErrors {
  materialId?: string;
  quantity?: string;
  date?: string;
  form?: string;
}

export function validateImport(
  materialId: string,
  quantity: number,
  txDate: string,
): ImportExportErrors {
  const errors: ImportExportErrors = {};
  if (!materialId) errors.materialId = "Vui lòng chọn vật tư.";
  if (!quantity || quantity <= 0)
    errors.quantity = "Số lượng phải lớn hơn 0.";
  if (!txDate) errors.date = "Vui lòng chọn ngày giao dịch.";
  return errors;
}

export function validateExport(
  materialId: string,
  quantity: number,
  available: number,
  txDate: string,
): ImportExportErrors {
  const errors: ImportExportErrors = {};
  if (!materialId) errors.materialId = "Vui lòng chọn vật tư.";
  if (!quantity || quantity <= 0)
    errors.quantity = "Số lượng phải lớn hơn 0.";
  else if (quantity > available)
    errors.quantity = `Số lượng vượt tồn khả dụng (${available}).`;
  if (!txDate) errors.date = "Vui lòng chọn ngày giao dịch.";
  return errors;
}

/** Format number with up to 1 decimal, no trailing zero */
export const fmtQty = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1);
