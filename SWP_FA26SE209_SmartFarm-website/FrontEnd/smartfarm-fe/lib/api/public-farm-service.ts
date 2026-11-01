import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { ApiResponse } from "./types";

export type PublicFarmInfo = {
  farmName: string;
  maxPreOrderDays: number;
  standardTraySize: string;
  maxDeliveryRadiusKm: number;
};

export type CustomerFarmArea = {
  farmAreaId: number;
  name: string;
  description: string | null;
  totalCapacity: number;
  totalTrays: number;
  availableTrays: number;
};

export type FarmReview = {
  reviewId: number;
  orderId: number;
  customerId: number;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type FarmRatings = {
  averageRating: number;
  totalReviews: number;
  items: FarmReview[];
  page: number;
  pageSize: number;
  totalItems: number;
};

export type CreateReviewRequest = { rating: number; comment?: string | null };

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

export function createPublicFarmService(client: ApiClient = apiClient) {
  return {
    async getInfo() {
      const response = await client.get<PublicFarmInfo>("/farm-info", { auth: false });
      return unwrap(response, "Không thể tải thông tin trang trại.");
    },
    async getFarmAreas() {
      const response = await client.get<CustomerFarmArea[]>("/farm-areas", { auth: false });
      return unwrap(response, "Không thể tải danh sách khu vực trồng.");
    },
    async getRatings(page = 1, pageSize = 6) {
      const response = await client.get<FarmRatings>("/reviews", {
        auth: false,
        query: { Page: page, PageSize: pageSize },
      });
      return unwrap(response, "Không thể tải đánh giá trang trại.");
    },
    async createReview(orderId: number, request: CreateReviewRequest) {
      const response = await client.post<FarmReview, CreateReviewRequest>(
        `/reviews/orders/${orderId}`,
        request,
      );
      return unwrap(response, "Không thể gửi đánh giá.");
    },
  };
}

export const publicFarmService = createPublicFarmService();
