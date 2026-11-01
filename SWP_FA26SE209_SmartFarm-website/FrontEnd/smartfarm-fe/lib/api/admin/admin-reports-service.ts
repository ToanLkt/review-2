import type { ApiClient } from "../client";

export type ReportDateRange = {
  from?: Date | string;
  to?: Date | string;
};

export type RevenueReport = {
  from: string | null;
  to: string | null;
  totalRevenue: number;
  successfulPayments: number;
  totalOrders: number;
  revenueByOrderType: Record<string, number>;
  ordersByStatus: Record<string, number>;
};

export type HarvestSupplySummary = {
  supplyId: number;
  supplyName: string;
  totalCycles: number;
  harvestedCycles: number;
};

export type HarvestReport = {
  from: string | null;
  to: string | null;
  totalCycles: number;
  harvestedCycles: number;
  failedCycles: number;
  completionRate: number;
  bySupply: HarvestSupplySummary[];
};

export type InventoryReport = {
  totalSupplies: number;
  lowStockSupplies: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  availableBySupplyType: Record<string, number>;
};

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

function reportRange(range: ReportDateRange) {
  return {
    from: range.from instanceof Date ? range.from : range.from ? new Date(range.from) : undefined,
    to: range.to instanceof Date ? range.to : range.to ? new Date(range.to) : undefined,
  };
}

export function createAdminReportsService(client: ApiClient) {
  return {
    async revenue(range: ReportDateRange = {}) {
      const response = await client.get<RevenueReport>("/admin/reports/revenue", {
        query: reportRange(range),
      });
      return required(response.data, "Không nhận được báo cáo doanh thu.");
    },

    async harvest(range: ReportDateRange = {}) {
      const response = await client.get<HarvestReport>("/admin/reports/harvest", {
        query: reportRange(range),
      });
      return required(response.data, "Không nhận được báo cáo thu hoạch.");
    },

    async inventory() {
      const response = await client.get<InventoryReport>("/admin/reports/inventory");
      return required(response.data, "Không nhận được báo cáo tồn kho.");
    },
  };
}
