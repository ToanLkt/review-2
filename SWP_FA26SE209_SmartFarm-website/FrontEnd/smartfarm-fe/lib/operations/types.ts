import type { Stage } from "@/lib/types";
export const trayStatuses = [
  "Sẵn sàng",
  "Đã giữ chỗ",
  "Đang trồng",
  "Chờ vệ sinh",
  "Bảo trì",
] as const;
export type TrayStatus = (typeof trayStatuses)[number];
export type AreaStatus = "Hoạt động" | "Bảo trì" | "Ngừng sử dụng";
export type Shelf = {
  id: string;
  name: string;
  levels: number;
  positionsPerLevel: number;
};
export type GrowingArea = {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string;
  status: AreaStatus;
  shelves: Shelf[];
};
export type TrayPosition = {
  id: string;
  areaId: string;
  shelfId: string;
  level: number;
  slot: number;
};
export type TrayEvent = {
  id: string;
  type:
    | "location"
    | "assignment"
    | "cycle"
    | "cleaning"
    | "maintenance"
    | "created";
  text: string;
  at: string;
  staff: string;
};
export type PhysicalTray = {
  id: string;
  code: string;
  specification: string;
  positionId: string | null;
  status: TrayStatus;
  notes: string;
  history: TrayEvent[];
};
export type RentalItem = {
  id: string;
  orderId: string;
  seed: string;
  quantity: number;
};
export type RentalAssignment = {
  id: string;
  trayId: string;
  itemId: string;
  orderId: string;
  orderCode?: string;
  customer: string;
  active: boolean;
  assignedAt: string;
};
export type PlantingCycle = {
  id: string;
  currentCycle?: number;
  totalCycles?: number;
  hasNextCycle?: boolean;
  trayId: string;
  assignmentId: string;
  seed: string;
  sowed: string;
  harvest: string;
  stage: Stage;
  active: boolean;
  varietyId?: string;
  growthDays?: number;
  lifecycle?: CycleStage;
  notes?: string;
  location?: {
    areaId: string;
    area: string;
    shelfId: string;
    shelf: string;
    tray: string;
  };
  timeline?: { text: string; at: string; staff: string; notes: string }[];
  harvestRecord?: {
    at: string;
    weight: number;
    quality: "Tốt" | "Đạt" | "Không đạt";
    notes: string;
  };
};
export const cycleStages = [
  "Chuẩn bị",
  "Đã gieo",
  "Nảy mầm",
  "Sinh trưởng",
  "Sẵn sàng thu hoạch",
  "Đã thu hoạch",
  "Đã hủy",
] as const;
export type CycleStage = (typeof cycleStages)[number];
export type CycleDraft = {
  varietyId: string;
  trayId: string;
  itemId: string;
  sowed: string;
  notes: string;
};
export type AreaDevice = {
  id: string;
  areaId: string;
  name: string;
  kind: "sensor" | "actuator";
  online: boolean;
  received: string;
  temperature?: number;
  humidity?: number;
  light?: number;
  water?: string;
};
export type OperationsState = {
  areas: GrowingArea[];
  trays: PhysicalTray[];
  items: RentalItem[];
  assignments: RentalAssignment[];
  cycles: PlantingCycle[];
  devices: AreaDevice[];
  revision: number;
};
export type AreaDraft = Omit<GrowingArea, "id" | "status">;
export type TrayDraft = Pick<
  PhysicalTray,
  "code" | "positionId" | "notes"
>;
