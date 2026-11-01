import type { ApiClient } from "../client";

export const SUPPLY_TYPES = ["SEED", "SOIL_SUBSTRATE", "PACKAGING", "EQUIPMENT"] as const;
export type SupplyType = (typeof SUPPLY_TYPES)[number];

export const MOVEMENT_TYPES = ["RECEIPT", "MANUAL_USAGE", "SALE"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type InventoryBalance = {
  supplyId: number;
  supplyName: string;
  supplyType: SupplyType | string;
  unit: string;
  onHand: number;
  reserved: number;
  available: number;
  minStockLevel: number;
  isLowStock: boolean;
};

export type MaterialMovement = {
  movementId: number;
  supplyId: number;
  supplyName: string;
  movementType: MovementType | string;
  quantity: number;
  balanceAfter: number;
  reason: string;
  orderId: number | null;
  createdByUserId: number | null;
  createdAt: string;
};

export type InventoryReconciliation = {
  supplyId: number;
  supplyName: string;
  currentAvailable: number;
  openingBalance: number | null;
  movementNet: number;
  expectedAvailable: number;
  difference: number;
  isReconciled: boolean;
  status: "RECONCILED" | "MISMATCH" | "NO_MOVEMENTS" | string;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type InventoryQuery = {
  supplyType?: SupplyType;
  lowStock?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type MovementQuery = {
  supplyId?: number;
  type?: MovementType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type InventoryAdjustmentRequest = { quantity: number; reason: string };

export function createStaffInventoryService(client: ApiClient) {
  return {
    async list(query: InventoryQuery = {}) {
      const response = await client.get<PagedResult<InventoryBalance>>("/staff/inventory", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async get(supplyId: number) {
      const response = await client.get<InventoryBalance>(`/staff/inventory/${supplyId}`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async receive(supplyId: number, request: InventoryAdjustmentRequest) {
      const response = await client.post<MaterialMovement, InventoryAdjustmentRequest>(
        `/staff/inventory/${supplyId}/receipts`, request,
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async use(supplyId: number, request: InventoryAdjustmentRequest) {
      const response = await client.post<MaterialMovement, InventoryAdjustmentRequest>(
        `/staff/inventory/${supplyId}/usages`, request,
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async movements(query: MovementQuery = {}) {
      const response = await client.get<PagedResult<MaterialMovement>>("/staff/inventory/movements", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async reconciliation(supplyId?: number) {
      const response = await client.get<InventoryReconciliation[]>("/staff/inventory/reconciliation", {
        query: { supplyId },
      });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
  };
}
