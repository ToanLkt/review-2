import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { ApiResponse } from "./types";

export type DeliveryPreview = {
  distanceKm: number | null;
  maxRadiusKm: number;
  isOutOfRange: boolean;
  requiresAcceptance: boolean;
};

export type DeliveryAcceptanceError = {
  distanceKm: number | null;
  requiresAcceptance: boolean;
};

export function getDeliveryAcceptanceError(error: unknown): DeliveryAcceptanceError | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const metadata = error.response?.errors;
  if (!metadata || typeof metadata !== "object") return null;
  const values = metadata as Record<string, unknown>;
  if (values.requiresAcceptance !== true) return null;
  return {
    distanceKm: typeof values.distanceKm === "number" && Number.isFinite(values.distanceKm)
      ? values.distanceKm
      : null,
    requiresAcceptance: true,
  };
}

function unwrap(response: ApiResponse<DeliveryPreview>): DeliveryPreview {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || "Không thể kiểm tra phạm vi giao hàng.", 200, response, response);
  }
  const preview = response.data;
  const validDistance = preview.distanceKm === null
    || (typeof preview.distanceKm === "number" && Number.isFinite(preview.distanceKm) && preview.distanceKm >= 0);
  if (!validDistance
    || typeof preview.maxRadiusKm !== "number"
    || !Number.isFinite(preview.maxRadiusKm)
    || preview.maxRadiusKm < 0
    || typeof preview.isOutOfRange !== "boolean"
    || typeof preview.requiresAcceptance !== "boolean") {
    throw new ApiError("Dữ liệu phạm vi giao hàng không hợp lệ.", 502, response, response);
  }
  return preview;
}

export function createDeliveryPreviewService(client: ApiClient = apiClient) {
  return {
    async getPreview(latitude: number, longitude: number) {
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new ApiError("Tọa độ giao hàng không hợp lệ.", 400, null, { latitude, longitude });
      }
      const response = await client.get<DeliveryPreview>("/delivery/preview", {
        auth: false,
        query: { lat: latitude, lng: longitude },
        signal: AbortSignal.timeout(15_000),
      });
      return unwrap(response);
    },
  };
}

export const deliveryPreviewService = createDeliveryPreviewService();
