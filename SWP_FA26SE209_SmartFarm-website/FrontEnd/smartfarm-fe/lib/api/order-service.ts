import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { PagedResult } from "./seed-service";
import type { ApiResponse } from "./types";
import type { TrayRentalLine } from "./rental-service";
import { normalizeOrderStatus, normalizeOrderType, type OrderStatus, type OrderType } from "./order-status";

export type CreateSeedPacketOrderRequest = {
  seedVarietyId: number;
  quantity: number;
  shippingAddress: string;
  shippingLatitude: number;
  shippingLongitude: number;
  isAccepted: boolean;
};

export type OrderItem = {
  orderItemId: number;
  supplyId: number;
  supplyName: string | null;
  itemType: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  totalCycles: number;
  currentCycle: number;
};

export type OrderSummary = {
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
};

export type OrderDetails = {
  orderId: number;
  orderCode: string | null;
  customerId: number;
  customerName: string | null;
  orderType: OrderType | null;
  status: OrderStatus | null;
  totalAmount: number;
  shippingAddress: string | null;
  shippingLatitude: number | null;
  shippingLongitude: number | null;
  deliveryDistanceKm: number | null;
  isAccepted: boolean;
  createdAt: string;
  paymentDueAt: string;
  items: OrderItem[] | null;
  rentals: TrayRentalLine[] | null;
  targetPlantingDate: string | null;
  targetDeliveryDate: string | null;
  isRiskAccepted: boolean;
  isReviewed: boolean;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
};

export type OrderQuery = {
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

function isOrderSummary(value: unknown): value is OrderSummary {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return typeof order.orderId === "number"
    && typeof order.totalAmount === "number"
    && typeof order.createdAt === "string"
    && typeof order.paymentDueAt === "string"
    && (order.status === null || order.status === normalizeOrderStatus(String(order.status)))
    && (order.orderType === null || order.orderType === normalizeOrderType(String(order.orderType)));
}

function isOrderDetails(value: unknown): value is OrderDetails {
  if (!isOrderSummary(value)) return false;
  const order = value as unknown as Record<string, unknown>;
  return typeof order.customerId === "number"
    && (order.items === null || Array.isArray(order.items));
}

function validateOrderDetails(value: unknown, fallback: string) {
  if (!isOrderDetails(value)) throw new ApiError(fallback, 200, null, value);
  return value;
}

function validateOrderPage(value: unknown): PagedResult<OrderSummary> {
  if (!value || typeof value !== "object") {
    throw new ApiError("Dữ liệu danh sách đơn hàng không hợp lệ.", 200, null, value);
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items)
    || typeof page.page !== "number"
    || typeof page.pageSize !== "number"
    || typeof page.totalItems !== "number"
    || typeof page.totalPages !== "number"
    || !page.items.every(isOrderSummary)) {
    throw new ApiError("Dữ liệu danh sách đơn hàng không đúng contract.", 200, null, value);
  }
  return page as PagedResult<OrderSummary>;
}

export function createOrderService(client: ApiClient = apiClient) {
  return {
    async createSeedPacketOrder(request: CreateSeedPacketOrderRequest) {
      const response = await client.post<unknown, CreateSeedPacketOrderRequest>("/orders/seed-packets", request);
      return validateOrderDetails(unwrap(response, "Không thể tạo đơn mua hạt giống."), "Dữ liệu đơn hàng vừa tạo không hợp lệ.");
    },

    async getOrders(query: OrderQuery = {}) {
      const response = await client.get<unknown>("/orders", {
        query: {
          Search: query.search?.trim() || undefined,
          Sort: query.sort?.trim() || undefined,
          Page: query.page,
          PageSize: query.pageSize,
        },
      });
      return validateOrderPage(unwrap(response, "Không thể tải danh sách đơn hàng."));
    },

    async getOrder(id: number) {
      const response = await client.get<unknown>(`/orders/${id}`);
      return validateOrderDetails(unwrap(response, "Không thể tải chi tiết đơn hàng."), "Dữ liệu chi tiết đơn hàng không hợp lệ.");
    },
  };
}

export const orderService = createOrderService();
