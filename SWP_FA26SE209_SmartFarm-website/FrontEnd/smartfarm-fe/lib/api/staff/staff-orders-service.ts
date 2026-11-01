import type { ApiClient } from "../client";

export const STAFF_ORDER_TYPES = ["TRAY_RENTAL", "SEED_PACKET"] as const;
export const STAFF_ORDER_STATUSES = [
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "PREPARING",
  "DELIVERING",
  "COMPLETED",
  "EXPIRED",
] as const;

export type StaffOrderType = (typeof STAFF_ORDER_TYPES)[number];
export type StaffOrderStatus = (typeof STAFF_ORDER_STATUSES)[number];

export type StaffOrderItem = {
  orderItemId: number;
  supplyId: number;
  supplyName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type StaffTrayRental = {
  trayRentalId: number;
  soilTrayId: number;
  trayCode: string;
  startDate: string;
  expectedHarvestDate: string;
  cropStatus: string;
};

export type StaffOrder = {
  orderId: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  orderType: StaffOrderType | string;
  status: StaffOrderStatus | string;
  totalAmount: number;
  shippingAddress: string | null;
  createdAt: string;
  paymentDueAt: string;
  items: StaffOrderItem[];
  rentals: StaffTrayRental[];
};

export type PagedStaffOrders = {
  items: StaffOrder[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type StaffOrderQuery = {
  search?: string;
  sort?: "createdAt" | "totalAmount" | "-totalAmount";
  page?: number;
  pageSize?: number;
  orderType?: StaffOrderType;
  status?: StaffOrderStatus;
};

export function createStaffOrdersService(client: ApiClient) {
  return {
    async list(query: StaffOrderQuery = {}) {
      const response = await client.get<PagedStaffOrders>("/staff/orders", {
        query,
      });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async listRentals(query: Omit<StaffOrderQuery, "orderType"> = {}) {
      const response = await client.get<PagedStaffOrders>(
        "/staff/orders/rentals",
        { query },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async get(orderId: number) {
      const response = await client.get<StaffOrder>(`/staff/orders/${orderId}`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async updateStatus(orderId: number, status: StaffOrderStatus) {
      const response = await client.patch<StaffOrder, { status: StaffOrderStatus }>(
        `/staff/orders/${orderId}/status`,
        { status },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
  };
}
