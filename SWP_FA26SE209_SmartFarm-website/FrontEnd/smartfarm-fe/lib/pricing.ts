import type { Variety } from "./varieties";
export const rentalUnits = [
  "khay / chu kỳ trồng",
  "khay / tuần",
  "khay / tháng",
  "dịch vụ / chu kỳ",
] as const;
export const seedUnits = [
  "gói 20 g / khay",
  "gói 25 g / khay",
  "gói 30 g / khay",
  "gói 50 g / khay",
] as const;
export type RentalType = {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  enabled: boolean;
  version: number;
  pricingType?: "TRAY_RENTAL_PRICE" | "CARE_FEE" | "DELIVERY_FEE";
  supplyId?: number | null;
};
export type SeedPrice = {
  id: string;
  code: string;
  varietyId: string;
  unit: string;
  price: number;
  enabled: boolean;
  notes: string;
  version: number;
};
export type RentalDraft = Omit<RentalType, "id" | "version">;
export type SeedDraft = Omit<SeedPrice, "id" | "version" | "code">;
export type PricingErrors = Partial<
  Record<keyof RentalDraft | keyof SeedDraft | "form", string>
>;
export type PricingState = { rentals: RentalType[]; seeds: SeedPrice[] };
export const initialPricing: PricingState = {
  rentals: [
    {
      id: "rental-1",
      code: "TK-01",
      name: "Khay ươm tiêu chuẩn 20×30",
      description: "Khay nhựa PP ươm mầm kích thước 20×30 cm.",
      unit: rentalUnits[0],
      price: 15000,
      enabled: true,
      version: 1,
    },
    {
      id: "rental-2",
      code: "TK-02",
      name: "Khay ươm lớn 30×50",
      description: "Khay nhựa PP kích thước 30×50 cm cho sản lượng cao.",
      unit: rentalUnits[0],
      price: 25000,
      enabled: true,
      version: 1,
    },
    {
      id: "rental-3",
      code: "TK-03",
      name: "Dịch vụ chăm sóc trọn gói",
      description: "Bao gồm khay, giá thể và chăm sóc theo dõi hằng ngày.",
      unit: rentalUnits[1],
      price: 40000,
      enabled: true,
      version: 1,
    },
    {
      id: "rental-4",
      code: "TK-04",
      name: "Khay ươm mini 15×20",
      description: "Khay nhỏ phù hợp khách trải nghiệm lần đầu.",
      unit: rentalUnits[0],
      price: 10000,
      enabled: false,
      version: 1,
    },
  ],
  seeds: [
    {
      id: "seed-price-1",
      code: "GG-01",
      varietyId: "var-1",
      unit: seedUnits[0],
      price: 8000,
      enabled: true,
      notes: "",
      version: 1,
    },
    {
      id: "seed-price-2",
      code: "GG-02",
      varietyId: "var-2",
      unit: seedUnits[0],
      price: 9000,
      enabled: true,
      notes: "",
      version: 1,
    },
    {
      id: "seed-price-3",
      code: "GG-03",
      varietyId: "var-3",
      unit: seedUnits[2],
      price: 12000,
      enabled: true,
      notes: "",
      version: 1,
    },
    {
      id: "seed-price-4",
      code: "GG-04",
      varietyId: "var-4",
      unit: seedUnits[2],
      price: 11000,
      enabled: false,
      notes: "",
      version: 1,
    },
    {
      id: "seed-price-5",
      code: "GG-05",
      varietyId: "var-7",
      unit: seedUnits[1],
      price: 7000,
      enabled: true,
      notes: "",
      version: 1,
    },
  ],
};
// Immutable historical unit-rate references, not a recalculation of full order totals.
export const agreedRates = [
  {
    orderId: "DH-101",
    rentalId: "rental-1",
    rentalCode: "TK-01",
    rentalPrice: 15000,
    rentalUnit: rentalUnits[0],
    seedId: "seed-price-1",
    seedPrice: 8000,
    seedUnit: seedUnits[0],
  },
  {
    orderId: "DH-102",
    rentalId: "rental-2",
    rentalCode: "TK-02",
    rentalPrice: 25000,
    rentalUnit: rentalUnits[0],
    seedId: "seed-price-2",
    seedPrice: 9000,
    seedUnit: seedUnits[0],
  },
  {
    orderId: "DH-103",
    rentalId: "rental-3",
    rentalCode: "TK-03",
    rentalPrice: 40000,
    rentalUnit: rentalUnits[1],
    seedId: "seed-price-3",
    seedPrice: 12000,
    seedUnit: seedUnits[2],
  },
] as const;
export const rentalWasUsed = (id?: string) =>
  agreedRates.some((a) => a.rentalId === id);
export const seedWasUsed = (id?: string) =>
  agreedRates.some((a) => a.seedId === id);
export const normalized = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
export const priceText = (price: number) =>
  `${price.toLocaleString("vi-VN")} ₫`;
export const seedSelectable = (price: SeedPrice, varieties: Variety[]) =>
  price.enabled &&
  !!varieties.find((v) => v.id === price.varietyId)?.enabledForNewRentals;
const validPrice = (price: number) => Number.isSafeInteger(price) && price >= 0;
export function validateRental(
  draft: RentalDraft,
  state: PricingState,
  id?: string,
): PricingErrors {
  const errors: PricingErrors = {},
    original = state.rentals.find((r) => r.id === id);
  if (id && !original) errors.form = "Không tìm thấy loại thuê.";
  if (!draft.name.trim()) errors.name = "Vui lòng nhập tên loại thuê.";
  if (!draft.code.trim()) errors.code = "Vui lòng nhập mã loại thuê.";
  else if (
    state.rentals.some(
      (r) =>
        r.id !== id &&
        r.code.trim().toLowerCase() === draft.code.trim().toLowerCase(),
    )
  )
    errors.code = "Mã loại thuê đã tồn tại.";
  if (
    original &&
    rentalWasUsed(id) &&
    draft.code.trim().toUpperCase() !== original.code
  )
    errors.code = "Mã loại thuê đã được sử dụng và không thể thay đổi.";
  if (!(rentalUnits as readonly string[]).includes(draft.unit))
    errors.unit = "Vui lòng chọn đơn vị tính hợp lệ.";
  if (!validPrice(draft.price))
    errors.price = "Giá thuê phải là số nguyên không âm hợp lệ.";
  return errors;
}
export function validateSeedPrice(
  draft: SeedDraft,
  state: PricingState,
  varieties: Variety[],
  id?: string,
): PricingErrors {
  const errors: PricingErrors = {},
    original = state.seeds.find((s) => s.id === id),
    variety = varieties.find((v) => v.id === draft.varietyId);
  if (id && !original) errors.form = "Không tìm thấy giá giống.";
  if (!variety) errors.varietyId = "Vui lòng chọn giống rau.";
  else if (
    !variety.enabledForNewRentals &&
    (!original || original.varietyId !== variety.id || draft.enabled)
  )
    errors.varietyId =
      "Giống rau đang tắt chọn. Hãy bật giống trong danh mục trước khi cho phép chọn giá.";
  if (!(seedUnits as readonly string[]).includes(draft.unit))
    errors.unit = "Vui lòng chọn đơn vị tính hợp lệ.";
  if (
    state.seeds.some(
      (s) =>
        s.id !== id && s.varietyId === draft.varietyId && s.unit === draft.unit,
    )
  )
    errors.unit =
      "Giống rau đã có giá cho đơn vị này. Hãy chỉnh sửa dòng hiện có.";
  if (!validPrice(draft.price))
    errors.price = "Giá phải là số nguyên không âm hợp lệ.";
  return errors;
}
export function saveRental(
  state: PricingState,
  draft: RentalDraft,
  id?: string,
): PricingState {
  const errors = validateRental(draft, state, id);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const previous = state.rentals.find((r) => r.id === id);
  const item: RentalType = {
    ...draft,
    id:
      id ??
      `rental-${Math.max(0, ...state.rentals.map((r) => Number(r.id.split("-").at(-1)))) + 1}`,
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    version: (previous?.version ?? 0) + 1,
  };
  return {
    ...state,
    rentals: previous
      ? state.rentals.map((r) => (r.id === id ? item : r))
      : [...state.rentals, item],
  };
}
export function saveSeedPrice(
  state: PricingState,
  draft: SeedDraft,
  varieties: Variety[],
  id?: string,
): PricingState {
  const errors = validateSeedPrice(draft, state, varieties, id);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const previous = state.seeds.find((s) => s.id === id),
    sequence =
      Math.max(0, ...state.seeds.map((s) => Number(s.code.slice(3)))) + 1;
  const item: SeedPrice = {
    ...draft,
    id: id ?? `seed-price-${sequence}`,
    code: previous?.code ?? `GG-${String(sequence).padStart(2, "0")}`,
    notes: draft.notes.trim(),
    version: (previous?.version ?? 0) + 1,
  };
  return {
    ...state,
    seeds: previous
      ? state.seeds.map((s) => (s.id === id ? item : s))
      : [...state.seeds, item],
  };
}
