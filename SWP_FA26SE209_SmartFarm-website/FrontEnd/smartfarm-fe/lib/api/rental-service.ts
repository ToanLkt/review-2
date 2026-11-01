import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { PagedResult } from "./seed-service";
import type { ApiResponse } from "./types";
import { normalizeOrderStatus, normalizeOrderType, type OrderStatus, type OrderType } from "./order-status";

export type CreateRentalRequest = {
  seedVarietyId: number;
  quantity: 1;
  farmAreaId?: number | null;
  targetPlantingDate?: string | null;
  targetDeliveryDate?: string | null;
  isRiskAccepted: boolean;
  totalCycles: number;
  shippingAddress: string;
  shippingLatitude: number;
  shippingLongitude: number;
  isAccepted: boolean;
};

export type CreateQuickRentalInput = Omit<CreateRentalRequest, "quantity">;

export type TrayRentalLine = {
  trayRentalId: number;
  soilTrayId: number;
  trayCode: string | null;
  startDate: string;
  expectedHarvestDate: string;
  cropStatus: string | null;
  totalCycles: number;
  currentCycle: number;
  actualHarvestDate: string | null;
};

export type RentalOrder = {
  orderId: number;
  orderCode: string | null;
  orderType: OrderType | null;
  status: OrderStatus | null;
  totalAmount: number;
  createdAt: string;
  paymentDueAt: string;
  rentals: TrayRentalLine[] | null;
  targetPlantingDate: string | null;
  targetDeliveryDate: string | null;
  isRiskAccepted: boolean;
  isReviewed: boolean;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  shippingAddress: string | null;
  shippingLatitude: number | null;
  shippingLongitude: number | null;
  deliveryDistanceKm: number | null;
  isAccepted: boolean;
};

export type RentalQuery = {
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function isRentalOrder(value: unknown): value is RentalOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return typeof order.orderId === "number"
    && typeof order.totalAmount === "number"
    && typeof order.createdAt === "string"
    && typeof order.paymentDueAt === "string"
    && (order.status === null || order.status === normalizeOrderStatus(String(order.status)))
    && (order.orderType === null || order.orderType === normalizeOrderType(String(order.orderType)));
}

function validateRentalOrder(value: unknown, fallback: string): RentalOrder {
  if (!isRentalOrder(value)) {
    throw new ApiError(fallback, 200, null, value);
  }
  return value;
}

function validateRentalPage(value: unknown): PagedResult<RentalOrder> {
  if (!value || typeof value !== "object") {
    throw new ApiError("Dữ liệu danh sách đơn thuê không hợp lệ.", 200, null, value);
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items)
    || typeof page.page !== "number"
    || typeof page.pageSize !== "number"
    || typeof page.totalItems !== "number"
    || typeof page.totalPages !== "number"
    || !page.items.every(isRentalOrder)) {
    throw new ApiError("Dữ liệu danh sách đơn thuê không đúng contract.", 200, null, value);
  }
  return page as PagedResult<RentalOrder>;
}

export function createRentalService(client: ApiClient = apiClient) {
  return {
    async createRental(input: CreateQuickRentalInput) {
      const request: CreateRentalRequest = { ...input, quantity: 1 };
      const response = await client.post<unknown, CreateRentalRequest>("/rentals", request);
      return validateRentalOrder(unwrap(response, "Không thể tạo đơn thuê."), "Dữ liệu đơn thuê vừa tạo không hợp lệ.");
    },

    async getRentals(query: RentalQuery = {}) {
      const response = await client.get<unknown>("/rentals", {
        query: {
          Search: query.search?.trim() || undefined,
          Sort: query.sort?.trim() || undefined,
          Page: query.page,
          PageSize: query.pageSize,
        },
      });
      return validateRentalPage(unwrap(response, "Không thể tải danh sách đơn thuê."));
    },

    async getRental(id: number) {
      const response = await client.get<unknown>(`/rentals/${id}`);
      return validateRentalOrder(unwrap(response, "Không thể tải chi tiết đơn thuê."), "Dữ liệu chi tiết đơn thuê không hợp lệ.");
    },
  };
}

export const rentalService = createRentalService();
