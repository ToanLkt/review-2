import type { ApiClient } from "../client";

export type FarmConfigRequest = {
  farmName: string;
  maxPreOrderDays: number;
  standardTraySize: string;
  maxDeliveryRadiusKm: number;
  discountCycleThreshold: number;
  discountTrayThreshold: number;
  loyalOrderThreshold: number;
  standardDiscountPercent: number;
  loyalDiscountPercent: number;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankOwnerName: string | null;
  farmLatitude?: number | null;
  farmLongitude?: number | null;
};

export type FarmConfig = FarmConfigRequest & {
  configId: number;
  updatedAt: string | null;
};

export function createAdminFarmConfigService(client: ApiClient) {
  return {
    async get() {
      const response = await client.get<FarmConfig>("/admin/farm-config");
      if (!response.data) throw new Error("Không nhận được cấu hình trang trại.");
      return response.data;
    },
    async update(request: FarmConfigRequest) {
      const response = await client.put<FarmConfig, FarmConfigRequest>("/admin/farm-config", request);
      if (!response.data) throw new Error("Không nhận được cấu hình trang trại đã cập nhật.");
      return response.data;
    },
  };
}
