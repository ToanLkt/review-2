export type Variety = {
  id: string;
  code: string;
  name: string;
  description: string;
  referenceGrowthDays: number;
  enabledForNewRentals: boolean;
};
export type VarietyDraft = Omit<Variety, "id">;
export const initialVarieties: Variety[] = [
  // Existing catalog IDs remain unchanged; the pricing reference adds var-7 below.
  {
    id: "var-1",
    code: "GR-001",
    name: "Cải xanh",
    description:
      "Giống cải mầm vị cay nhẹ, nảy mầm nhanh, phù hợp trồng quanh năm.",
    referenceGrowthDays: 7,
    enabledForNewRentals: true,
  },
  {
    id: "var-2",
    code: "GR-002",
    name: "Củ cải trắng",
    description: "Mầm củ cải giòn, vị hăng đặc trưng, giàu vitamin C.",
    referenceGrowthDays: 6,
    enabledForNewRentals: true,
  },
  {
    id: "var-3",
    code: "GR-003",
    name: "Hướng dương",
    description:
      "Mầm hướng dương thân mập, vị bùi, cần ngâm hạt trước khi gieo.",
    referenceGrowthDays: 9,
    enabledForNewRentals: true,
  },
  {
    id: "var-4",
    code: "GR-004",
    name: "Đậu Hà Lan",
    description: "Mầm đậu ngọt, thân dài, ưa mát, thích hợp làm salad.",
    referenceGrowthDays: 10,
    enabledForNewRentals: false,
  },
  // Temporary entries: names and descriptions are not taken from the reference.
  {
    id: "var-5",
    code: "GR-005",
    name: "Cải củ đỏ",
    description: "Mầm cải củ đỏ có thân hồng, vị cay nhẹ, dùng kèm món trộn.",
    referenceGrowthDays: 7,
    enabledForNewRentals: true,
  },
  {
    id: "var-6",
    code: "GR-006",
    name: "Rau muống",
    description:
      "Mầm rau muống có thân mềm, vị thanh, phù hợp dùng trong món rau tươi.",
    referenceGrowthDays: 8,
    enabledForNewRentals: false,
  },
  {
    id: "var-7",
    code: "GR-007",
    name: "Lúa mì",
    description: "Cỏ lúa mì dùng ép nước, thời gian sinh trưởng ngắn.",
    referenceGrowthDays: 8,
    enabledForNewRentals: true,
  },
];
export type VarietyErrors = Partial<
  Record<keyof VarietyDraft | "form", string>
>;
export function validateVariety(
  draft: VarietyDraft,
  catalog: Variety[],
  id?: string,
): VarietyErrors {
  const errors: VarietyErrors = {};
  if (!draft.name.trim()) errors.name = "Vui lòng nhập tên giống rau.";
  // Backend assigns SupplyId; the displayed code is derived from that ID.
  if (
    !Number.isSafeInteger(draft.referenceGrowthDays) ||
    draft.referenceGrowthDays <= 0
  )
    errors.referenceGrowthDays =
      "Thời gian sinh trưởng phải là số nguyên dương.";
  return errors;
}
export function catalogSummary(catalog: Variety[]) {
  return {
    total: catalog.length,
    enabled: catalog.filter((v) => v.enabledForNewRentals).length,
    disabled: catalog.filter((v) => !v.enabledForNewRentals).length,
    average: catalog.length
      ? catalog.reduce((s, v) => s + v.referenceGrowthDays, 0) / catalog.length
      : 0,
  };
}
export function filterVarieties(
  catalog: Variety[],
  query: string,
  status: string,
) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase();
  return catalog.filter(
    (v) =>
      (!status || v.enabledForNewRentals === (status === "enabled")) &&
      normalize(v.name + " " + v.code + " " + v.description).includes(
        normalize(query.trim()),
      ),
  );
}
