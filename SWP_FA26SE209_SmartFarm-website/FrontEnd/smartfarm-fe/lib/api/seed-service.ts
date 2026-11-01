import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { ApiResponse } from "./types";

export type SeedVariety = {
  seedVarietyId: number;
  name: string | null;
  description: string | null;
  growthDays: number;
  rentalPricePerTray: number;
  salePricePerPacket: number;
  riskDescription: string | null;
  expectedYield: string | null;
  standardTraySize: string | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type SeedVarietyQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AvailableTrayQuery = SeedVarietyQuery & {
  sort?: string;
  fields?: string;
  expand?: "farmArea";
  farmAreaId?: number;
};

export type AvailableTray = {
  soilTrayId: number;
  code: string | null;
  status: string | null;
  farmAreaId: number;
  farmAreaName: string | null;
};
export type AvailableTrayCount = { available: number };

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function pagingQuery(query: SeedVarietyQuery) {
  return {
    Search: query.search?.trim() || undefined,
    Page: query.page,
    PageSize: query.pageSize,
  };
}

export function createSeedService(client: ApiClient = apiClient) {
  async function getAvailableTrays(query: AvailableTrayQuery = {}) {
    const response = await client.get<PagedResult<AvailableTray>>(
      "/trays/available",
      {
        auth: false,
        query: {
          ...pagingQuery(query),
          Sort: query.sort?.trim() || undefined,
          Fields: query.fields?.trim() || undefined,
          Expand: query.expand,
          farmAreaId: query.farmAreaId,
        },
      },
    );
    return unwrap(response, "Không thể tải danh sách khay khả dụng.");
  }

  async function getAvailableTrayCount(farmAreaId?: number) {
    const response = await client.get<AvailableTrayCount>(
      "/trays/available/count",
      { auth: false, query: { farmAreaId } },
    );
    return unwrap(response, "Không thể tải số lượng khay khả dụng.");
  }

  return {
    async getSeedVarieties(query: SeedVarietyQuery = {}) {
      const response = await client.get<PagedResult<SeedVariety>>(
      "/seed-varieties",
      { auth: false, query: pagingQuery(query) },
      );
      return unwrap(response, "Không thể tải danh sách giống cây.");
    },

    async getSeedVariety(id: number) {
      const response = await client.get<SeedVariety>(`/seed-varieties/${id}`, {
        auth: false,
      });
      return unwrap(response, "Không thể tải thông tin giống cây.");
    },

    getAvailableTrays,

    getAvailableTrayCount,

    async getAvailableTrayOverview(farmAreaId?: number) {
      const [list, count] = await Promise.all([
        getAvailableTrays({ page: 1, pageSize: 1, farmAreaId }),
        getAvailableTrayCount(farmAreaId),
      ]);
      return { list, count };
    },
  };
}

export const seedService = createSeedService();
