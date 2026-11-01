import type { ApiClient } from "../client";

export const DELIVERY_STATUSES = ["PENDING", "PACKAGED", "SHIPPING", "DELIVERED", "FAILED"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type StaffDelivery = {
  deliveryId: number;
  orderId: number;
  orderCode: string;
  rentalId: number | null;
  cycleNumber: number;
  shipperId: number | null;
  shipperName: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  scheduledDeliveryAt: string | null;
  trackingCode: string | null;
  actualWeightKg: number | null;
  status: DeliveryStatus | string;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
};

export type PagedStaffDeliveries = {
  items: StaffDelivery[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type StaffDeliveryQuery = {
  search?: string;
  status?: DeliveryStatus;
  page?: number;
  pageSize?: number;
};

export type CreateStaffDeliveryRequest = {
  orderId: number;
  rentalId: number | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes?: string | null;
};

export type UpdateStaffDeliveryRequest = {
  status: DeliveryStatus;
  trackingCode?: string | null;
  actualWeightKg?: number | null;
  notes?: string | null;
};

export function createStaffDeliveriesService(client: ApiClient) {
  return {
    async create(request: CreateStaffDeliveryRequest) {
      const response = await client.post<StaffDelivery, CreateStaffDeliveryRequest>(
        "/staff/deliveries",
        request,
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async list(query: StaffDeliveryQuery = {}) {
      const response = await client.get<PagedStaffDeliveries>("/staff/deliveries", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async get(deliveryId: number) {
      const response = await client.get<StaffDelivery>(`/staff/deliveries/${deliveryId}`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async assignShipper(deliveryId: number, shipperId: number) {
      const response = await client.put<StaffDelivery, { shipperId: number }>(
        `/staff/deliveries/${deliveryId}/shipper`,
        { shipperId },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async update(deliveryId: number, request: UpdateStaffDeliveryRequest) {
      const response = await client.patch<StaffDelivery, UpdateStaffDeliveryRequest>(
        `/staff/deliveries/${deliveryId}`,
        request,
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
  };
}
