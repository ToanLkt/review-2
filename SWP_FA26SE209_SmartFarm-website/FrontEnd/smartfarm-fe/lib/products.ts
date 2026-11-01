// ---------------------------------------------------------------------------
// Seed‑product data layer – types, mock data, helpers
// ---------------------------------------------------------------------------

/** Selling status of a product */
export type ProductStatus = "Đang bán" | "Tạm ngừng" | "Hết hàng";

/** A packaged seed product */
export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  /** Grams per package */
  weight: number;
  /** Price in VND */
  price: number;
  actualStock: number;
  reserved: number;
  available: number;
  status: ProductStatus;
  storageInstruction: string;
}

/** An import batch */
export interface Batch {
  id: string;
  productId: string;
  productName: string;
  importDate: string;
  expiryDate: string;
  quantity: number;
}

/** Draft used in the create / edit form */
export interface ProductDraft {
  name: string;
  code: string;
  category: string;
  description: string;
  weight: number;
  price: number;
  storageInstruction: string;
  status: ProductStatus;
}

export type ProductErrors = Partial<Record<keyof ProductDraft | "form", string>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const categories = [
  "Cải xanh",
  "Củ cải đỏ",
  "Hướng dương",
  "Đậu Hà Lan",
  "Lúa mì",
  "Rau muống",
  "Rau mầm tổng hợp",
];

export const statuses: ProductStatus[] = ["Đang bán", "Tạm ngừng", "Hết hàng"];

// ---------------------------------------------------------------------------
// Mock products
// ---------------------------------------------------------------------------
export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Hạt giống cải xanh",
    code: "SP-001",
    category: "Cải xanh",
    description:
      "Hạt giống cải xanh chất lượng cao, tỷ lệ nảy mầm trên 95%. Phù hợp trồng rau mầm tại nhà.",
    weight: 50,
    price: 25000,
    actualStock: 48,
    reserved: 12,
    available: 36,
    status: "Đang bán",
    storageInstruction:
      "Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.",
  },
  {
    id: "prod-2",
    name: "Hạt giống củ cải đỏ",
    code: "SP-002",
    category: "Củ cải đỏ",
    description:
      "Hạt giống củ cải đỏ nhập khẩu, rau mầm giàu dinh dưỡng. Thời gian thu hoạch 5–7 ngày.",
    weight: 50,
    price: 28000,
    actualStock: 32,
    reserved: 8,
    available: 24,
    status: "Đang bán",
    storageInstruction:
      "Bảo quản nơi khô ráo, thoáng mát, nhiệt độ dưới 30°C.",
  },
  {
    id: "prod-3",
    name: "Hạt giống hướng dương",
    code: "SP-003",
    category: "Hướng dương",
    description:
      "Hạt hướng dương giống đen, rau mầm giòn ngọt. Thời gian thu hoạch 7–10 ngày.",
    weight: 100,
    price: 35000,
    actualStock: 0,
    reserved: 0,
    available: 0,
    status: "Hết hàng",
    storageInstruction:
      "Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.",
  },
  {
    id: "prod-4",
    name: "Hạt giống đậu Hà Lan",
    code: "SP-004",
    category: "Đậu Hà Lan",
    description:
      "Hạt giống đậu Hà Lan trồng rau mầm, thân mập, vị ngọt thanh. Thu hoạch sau 8–12 ngày.",
    weight: 100,
    price: 32000,
    actualStock: 15,
    reserved: 5,
    available: 10,
    status: "Tạm ngừng",
    storageInstruction: "Bảo quản nơi khô ráo, nhiệt độ dưới 25°C.",
  },
  {
    id: "prod-5",
    name: "Hạt giống lúa mì",
    code: "SP-005",
    category: "Lúa mì",
    description:
      "Hạt lúa mì giống trồng cỏ lúa mì (wheatgrass). Giàu chất xơ và vitamin.",
    weight: 50,
    price: 22000,
    actualStock: 60,
    reserved: 0,
    available: 60,
    status: "Đang bán",
    storageInstruction:
      "Bảo quản nơi khô ráo, thoáng mát, tránh ẩm ướt.",
  },
];

// ---------------------------------------------------------------------------
// Mock batches
// ---------------------------------------------------------------------------
export const initialBatches: Batch[] = [
  {
    id: "NK-022",
    productId: "prod-1",
    productName: "Hạt giống cải xanh",
    importDate: "2026-09-01",
    expiryDate: "2027-03-01",
    quantity: 48,
  },
  {
    id: "NK-023",
    productId: "prod-2",
    productName: "Hạt giống củ cải đỏ",
    importDate: "2026-08-20",
    expiryDate: "2027-02-20",
    quantity: 32,
  },
  {
    id: "NK-024",
    productId: "prod-4",
    productName: "Hạt giống đậu Hà Lan",
    importDate: "2026-08-15",
    expiryDate: "2026-11-15",
    quantity: 15,
  },
  {
    id: "NK-025",
    productId: "prod-5",
    productName: "Hạt giống lúa mì",
    importDate: "2026-09-10",
    expiryDate: "2027-03-10",
    quantity: 60,
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

export function filterProducts(
  products: Product[],
  query: string,
  category: string,
  status: string,
): Product[] {
  const q = norm(query);
  return products.filter(
    (p) =>
      (!q || norm(p.name + " " + p.code).includes(q)) &&
      (!category || p.category === category) &&
      (!status || p.status === status),
  );
}

export function productSummary(products: Product[]) {
  const selling = products.filter((p) => p.status === "Đang bán").length;
  const totalStock = products.reduce((s, p) => s + p.actualStock, 0);
  const totalReserved = products.reduce((s, p) => s + p.reserved, 0);
  return { selling, totalStock, totalReserved };
}

export function inventorySummary(products: Product[], batches: Batch[]) {
  const totalStock = products.reduce((s, p) => s + p.actualStock, 0);
  const uniqueBatches = batches.length;
  const today = new Date().toISOString().slice(0, 10);
  const threeMonths = new Date(Date.now() + 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  const expiringSoon = batches.filter(
    (b) => b.expiryDate >= today && b.expiryDate <= threeMonths,
  ).length;
  return { totalStock, uniqueBatches, expiringSoon };
}

export function validateProduct(
  draft: ProductDraft,
  existing: Product[],
  editId?: string,
): ProductErrors {
  const errors: ProductErrors = {};
  if (!draft.name.trim()) errors.name = "Tên sản phẩm là bắt buộc.";
  if (!draft.code.trim()) errors.code = "Mã sản phẩm là bắt buộc.";
  else if (
    existing.some(
      (p) =>
        p.code.toLowerCase() === draft.code.trim().toLowerCase() &&
        p.id !== editId,
    )
  )
    errors.code = "Mã sản phẩm đã tồn tại.";
  if (draft.weight <= 0) errors.weight = "Khối lượng phải lớn hơn 0.";
  if (draft.price <= 0) errors.price = "Giá bán phải lớn hơn 0.";
  return errors;
}
