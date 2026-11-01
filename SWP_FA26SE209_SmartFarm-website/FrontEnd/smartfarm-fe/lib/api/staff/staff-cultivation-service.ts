import type { ApiClient } from "../client";

export const CULTIVATION_SUPPLY_TYPES = ["SEED", "SOIL_SUBSTRATE", "PACKAGING", "EQUIPMENT"] as const;
export const GROWTH_STAGES = ["GERMINATION", "GROWING", "HARVEST"] as const;
export const CROP_STATUSES = ["WAITING_PLANTING", "PLANTED", "GERMINATING", "GROWING", "READY_TO_HARVEST", "HARVESTED", "FAILED"] as const;
export const DAILY_TASK_STATUSES = ["PENDING", "COMPLETED", "SKIPPED"] as const;
export type CultivationSupplyType = (typeof CULTIVATION_SUPPLY_TYPES)[number];
export type GrowthStage = (typeof GROWTH_STAGES)[number];
export type CropStatus = (typeof CROP_STATUSES)[number];
export type DailyTaskStatus = (typeof DAILY_TASK_STATUSES)[number];

export type CultivationSupply = {
  supplyId: number; supplyName: string; supplyType: CultivationSupplyType | string;
  description: string | null; harvestDays: number; imageUrl: string | null;
  costPrice: number; unitPrice: number; rentalPrice: number; quantityInStock: number;
  unit: string; minStockLevel: number; isActive: boolean;
};
export type SupplyRequest = Omit<CultivationSupply, "supplyId">;

export type CropThreshold = {
  thresholdId: number; supplyId: number; stage: GrowthStage | string;
  minSoilMoisture: number; maxSoilMoisture: number; minAirHumidity: number;
  maxAirHumidity: number; minTemperature: number; maxTemperature: number;
  minLightIntensity: number; maxLightIntensity: number; lightHoursPerDay: number;
};
export type CropThresholdRequest = Omit<CropThreshold, "thresholdId">;

export type CareSchedule = {
  scheduleId: number; supplyId: number; dayIndex: number; taskName: string;
  taskDescription: string | null; targetStage: GrowthStage | string;
};
export type CareScheduleRequest = Omit<CareSchedule, "scheduleId">;

export type GrowingCycle = {
  rentalId: number; soilTrayId: number; supplyId: number;
  startDate: string; expectedHarvestDate: string; actualHarvestDate: string | null;
  cropStatus: CropStatus | string; currentCycle: number; totalCycles: number; hasNextCycle: boolean;
};
export type StartGrowingCycleRequest = {
  customerId: number; soilTrayId: number; supplyId: number; orderId: number; startDate: string | null;
};

export type DailyTask = {
  taskId: number; rentalId: number; assignedUserId: number | null; taskName: string;
  dueDate: string; status: DailyTaskStatus | string; completedAt: string | null; notes: string | null;
  assignedUserName?: string | null; supplyName?: string | null; trayCode?: string | null; orderCode?: string | null; zoneName?: string | null;
};

export function createStaffCultivationService(client: ApiClient) {
  return {
    async supplies(query: { type?: CultivationSupplyType; active?: boolean } = {}) {
      const response = await client.get<CultivationSupply[]>("/staff/cultivation/supplies", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async supply(id: number) {
      const response = await client.get<CultivationSupply>(`/staff/cultivation/supplies/${id}`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async createSupply(request: SupplyRequest) {
      const response = await client.post<CultivationSupply, SupplyRequest>("/staff/cultivation/supplies", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async updateSupply(id: number, request: SupplyRequest) {
      const response = await client.put<CultivationSupply, SupplyRequest>(`/staff/cultivation/supplies/${id}`, request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async deactivateSupply(id: number) { await client.delete<unknown>(`/staff/cultivation/supplies/${id}`); },

    async thresholds(supplyId?: number) {
      const response = await client.get<CropThreshold[]>("/staff/cultivation/thresholds", { query: { supplyId } });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async createThreshold(request: CropThresholdRequest) {
      const response = await client.post<CropThreshold, CropThresholdRequest>("/staff/cultivation/thresholds", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async updateThreshold(id: number, request: CropThresholdRequest) {
      const response = await client.put<CropThreshold, CropThresholdRequest>(`/staff/cultivation/thresholds/${id}`, request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async deleteThreshold(id: number) { await client.delete<unknown>(`/staff/cultivation/thresholds/${id}`); },

    async schedules(supplyId?: number) {
      const response = await client.get<CareSchedule[]>("/staff/cultivation/care-schedules", { query: { supplyId } });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async createSchedule(request: CareScheduleRequest) {
      const response = await client.post<CareSchedule, CareScheduleRequest>("/staff/cultivation/care-schedules", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async updateSchedule(id: number, request: CareScheduleRequest) {
      const response = await client.put<CareSchedule, CareScheduleRequest>(`/staff/cultivation/care-schedules/${id}`, request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async deleteSchedule(id: number) { await client.delete<unknown>(`/staff/cultivation/care-schedules/${id}`); },

    async cycles(status?: CropStatus) {
      const response = await client.get<GrowingCycle[]>("/staff/cultivation/cycles", { query: { status } });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async startCycle(request: StartGrowingCycleRequest) {
      const response = await client.post<GrowingCycle, StartGrowingCycleRequest>("/staff/cultivation/cycles", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async updateCycleStatus(id: number, status: CropStatus) {
      const response = await client.put<GrowingCycle, { status: CropStatus }>(`/staff/cultivation/cycles/${id}/status`, { status });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async harvest(id: number, actualHarvestDate: string | null) {
      const response = await client.put<GrowingCycle, { actualHarvestDate: string | null }>(`/staff/cultivation/cycles/${id}/harvest`, { actualHarvestDate });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async nextCycle(id: number) {
      const response = await client.post<GrowingCycle>(`/staff/cultivation/cycles/${id}/next-cycle`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async generateTasks(id: number) {
      const response = await client.post<{ created: number }>(`/staff/cultivation/cycles/${id}/tasks/generate`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },

    async tasks(query: { rentalId?: number; status?: DailyTaskStatus } = {}) {
      const response = await client.get<DailyTask[]>("/staff/cultivation/tasks", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async assignTask(id: number, assignedUserId: number | null) {
      const response = await client.put<DailyTask, { assignedUserId: number | null }>(`/staff/cultivation/tasks/${id}/assignee`, { assignedUserId });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
    async completeTask(id: number, request: { status: "COMPLETED" | "SKIPPED"; notes: string | null }) {
      const response = await client.put<DailyTask, typeof request>(`/staff/cultivation/tasks/${id}/complete`, request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại."); return response.data;
    },
  };
}
