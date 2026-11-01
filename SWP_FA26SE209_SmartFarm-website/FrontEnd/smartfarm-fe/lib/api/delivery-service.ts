import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { PagedResult } from "./seed-service";
import type { ApiResponse } from "./types";

export const deliveryStatuses = ["PENDING", "PACKAGED", "SHIPPING", "DELIVERED", "FAILED"] as const;
export type DeliveryStatus = (typeof deliveryStatuses)[number];

export function normalizeDeliveryStatus(value: string | null | undefined): DeliveryStatus | null {
  const normalized = value?.trim().toUpperCase();
  return deliveryStatuses.find((status) => status === normalized) ?? null;
}

export type Delivery = {
  deliveryId: number;
  orderId: number;
  orderCode: string | null;
  rentalId: number | null;
  cycleNumber: number;
  shipperId: number | null;
  shipperName: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  shippingAddress: string | null;
  scheduledDeliveryAt: string | null;
  trackingCode: string | null;
  actualWeightKg: number | null;
  status: DeliveryStatus | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
};

export type ScheduleDeliveryRequest = {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  scheduledDeliveryAt: string;
  notes: string | null;
  shippingLatitude: number;
  shippingLongitude: number;
  isAccepted: boolean;
  cycleNumber: number;
  deliveryId: number;
};

export type DeliveryQuery = {
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

function isDelivery(value: unknown): value is Delivery {
  if (!value || typeof value !== "object") return false;
  const delivery = value as Record<string, unknown>;
  return typeof delivery.deliveryId === "number"
    && typeof delivery.orderId === "number"
    && typeof delivery.cycleNumber === "number"
    && (delivery.status === null || delivery.status === normalizeDeliveryStatus(String(delivery.status)));
}

function validateDelivery(value: unknown, fallback: string) {
  if (!isDelivery(value)) throw new ApiError(fallback, 200, null, value);
  return value;
}

function validateDeliveryPage(value: unknown): PagedResult<Delivery> {
  if (!value || typeof value !== "object") {
    throw new ApiError("Dữ liệu danh sách giao hàng không hợp lệ.", 200, null, value);
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items)
    || typeof page.page !== "number"
    || typeof page.pageSize !== "number"
    || typeof page.totalItems !== "number"
    || typeof page.totalPages !== "number"
    || !page.items.every(isDelivery)) {
    throw new ApiError("Dữ liệu danh sách giao hàng không đúng contract phân trang.", 200, null, value);
  }
  return page as PagedResult<Delivery>;
}

export function createDeliveryService(client: ApiClient = apiClient) {
  return {
    async getDeliveries(query: DeliveryQuery = {}) {
      const response = await client.get<unknown>("/deliveries", {
        query: {
          Search: query.search?.trim() || undefined,
          Sort: query.sort?.trim() || undefined,
          Page: query.page,
          PageSize: query.pageSize,
        },
      });
      return validateDeliveryPage(unwrap(response, "Không thể tải danh sách giao hàng."));
    },

    async getDelivery(id: number) {
      const response = await client.get<unknown>(`/deliveries/${id}`);
      return validateDelivery(unwrap(response, "Không thể tải chi tiết giao hàng."), "Dữ liệu chi tiết giao hàng không hợp lệ.");
    },

    async scheduleDelivery(orderId: number, request: ScheduleDeliveryRequest) {
      const response = await client.put<unknown, ScheduleDeliveryRequest>(`/deliveries/orders/${orderId}/schedule`, request);
      return validateDelivery(unwrap(response, "Không thể đặt lịch giao hàng."), "Dữ liệu lịch giao hàng không hợp lệ.");
    },

    async scheduleDeliveryById(deliveryId: number, request: ScheduleDeliveryRequest) {
      if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
        throw new Error("deliveryId must be a positive integer.");
      }
      const response = await client.put<unknown, ScheduleDeliveryRequest>(`/deliveries/${deliveryId}/schedule`, request);
      return validateDelivery(unwrap(response, "Không thể đặt lịch giao hàng."), "Dữ liệu lịch giao hàng không hợp lệ.");
    },
  };
}

export const deliveryService = createDeliveryService();
