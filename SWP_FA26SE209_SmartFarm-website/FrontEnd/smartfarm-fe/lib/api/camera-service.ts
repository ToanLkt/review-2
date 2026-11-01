import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { PagedResult } from "./seed-service";
import type { ApiResponse } from "./types";

export type CameraSnapshot = {
  snapshotId: number;
  deviceId: number;
  rentalId: number;
  imageUrl: string | null;
  takenAt: string;
};

export type CameraHistoryQuery = {
  page?: number;
  pageSize?: number;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function isSnapshot(value: unknown): value is CameraSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return typeof snapshot.snapshotId === "number"
    && typeof snapshot.deviceId === "number"
    && typeof snapshot.rentalId === "number"
    && (snapshot.imageUrl === null || typeof snapshot.imageUrl === "string")
    && typeof snapshot.takenAt === "string";
}

function validateSnapshot(value: unknown, fallback: string) {
  if (!isSnapshot(value)) throw new ApiError(fallback, 200, null, value);
  return value;
}

function validateHistory(value: unknown): PagedResult<CameraSnapshot> {
  if (!value || typeof value !== "object") {
    throw new ApiError("Dữ liệu lịch sử hình ảnh không hợp lệ.", 200, null, value);
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items)
    || typeof page.page !== "number"
    || typeof page.pageSize !== "number"
    || typeof page.totalItems !== "number"
    || typeof page.totalPages !== "number"
    || !page.items.every(isSnapshot)) {
    throw new ApiError("Dữ liệu lịch sử hình ảnh không đúng contract phân trang.", 200, null, value);
  }
  return page as PagedResult<CameraSnapshot>;
}

export function resolveCameraImageUrl(imageUrl: string | null) {
  if (!imageUrl?.trim()) return null;
  try {
    return new URL(imageUrl).toString();
  } catch {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
      || "https://api.sumfas.id.vn";
    try {
      return new URL(imageUrl, `${baseUrl.replace(/\/+$/, "")}/`).toString();
    } catch {
      return null;
    }
  }
}

export function createCameraService(client: ApiClient = apiClient) {
  return {
    async getLatest(rentalId: number) {
      const response = await client.get<unknown>(`/rentals/${rentalId}/camera/latest`);
      return validateSnapshot(unwrap(response, "Không thể tải ảnh mới nhất."), "Dữ liệu ảnh camera không hợp lệ.");
    },

    async getHistory(rentalId: number, query: CameraHistoryQuery = {}) {
      const response = await client.get<unknown>(`/rentals/${rentalId}/camera/history`, {
        query: { Page: query.page, PageSize: query.pageSize },
      });
      return validateHistory(unwrap(response, "Không thể tải lịch sử hình ảnh."));
    },
  };
}

export const cameraService = createCameraService();
