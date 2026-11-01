import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { PagedResult } from "./seed-service";
import type { ApiResponse } from "./types";

export type TelemetryReading = {
  messageId: string | null;
  deviceCode: string | null;
  recordedAt: string;
  temperature: number | null;
  airHumidity: number | null;
  soilHumidity: number | null;
  lightIntensity: number | null;
  waterLevel: number | null;
  fanState?: boolean | null;
  ledState?: boolean | null;
  pumpState?: boolean | null;
  isStale?: boolean;
};

export type TelemetryHistoryQuery = {
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  from?: Date;
  to?: Date;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function isNullableNumber(value: unknown) {
  return value === undefined || value === null || typeof value === "number";
}

function isNullableBoolean(value: unknown) {
  return value === undefined || value === null || typeof value === "boolean";
}

function isTelemetryReading(value: unknown): value is TelemetryReading {
  if (!value || typeof value !== "object") return false;
  const reading = value as Record<string, unknown>;
  return typeof reading.recordedAt === "string"
    && isNullableNumber(reading.temperature)
    && isNullableNumber(reading.airHumidity)
    && isNullableNumber(reading.soilHumidity)
    && isNullableNumber(reading.lightIntensity)
    && isNullableNumber(reading.waterLevel)
    && isNullableBoolean(reading.fanState)
    && isNullableBoolean(reading.ledState)
    && isNullableBoolean(reading.pumpState)
    && (reading.isStale === undefined || typeof reading.isStale === "boolean");
}

function normalizeReading(value: unknown, fallback: string): TelemetryReading {
  if (!isTelemetryReading(value)) throw new ApiError(fallback, 200, null, value);
  return {
    messageId: value.messageId ?? null,
    deviceCode: value.deviceCode ?? null,
    recordedAt: value.recordedAt,
    temperature: value.temperature ?? null,
    airHumidity: value.airHumidity ?? null,
    soilHumidity: value.soilHumidity ?? null,
    lightIntensity: value.lightIntensity ?? null,
    waterLevel: value.waterLevel ?? null,
    fanState: value.fanState ?? null,
    ledState: value.ledState ?? null,
    pumpState: value.pumpState ?? null,
    isStale: value.isStale ?? false,
  };
}

function validateHistory(value: unknown): PagedResult<TelemetryReading> {
  if (!value || typeof value !== "object") {
    throw new ApiError("Dữ liệu lịch sử telemetry không hợp lệ.", 200, null, value);
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items)
    || typeof page.page !== "number"
    || typeof page.pageSize !== "number"
    || typeof page.totalItems !== "number"
    || typeof page.totalPages !== "number"
    || !page.items.every(isTelemetryReading)) {
    throw new ApiError("Dữ liệu lịch sử telemetry không đúng contract phân trang.", 200, null, value);
  }
  return { ...page, items: page.items.map((item) => normalizeReading(item, "Dữ liệu telemetry không hợp lệ.")) } as PagedResult<TelemetryReading>;
}

export function createTelemetryService(client: ApiClient = apiClient) {
  return {
    async getLatest(rentalId: number) {
      const response = await client.get<unknown>(`/rentals/${rentalId}/telemetry/latest`);
      return normalizeReading(unwrap(response, "Không thể tải telemetry mới nhất."), "Dữ liệu telemetry mới nhất không hợp lệ.");
    },

    async getHistory(rentalId: number, query: TelemetryHistoryQuery = {}) {
      const response = await client.get<unknown>(`/rentals/${rentalId}/telemetry/history`, {
        query: {
          Search: query.search?.trim() || undefined,
          Sort: query.sort?.trim() || undefined,
          Page: query.page,
          PageSize: query.pageSize,
          from: query.from,
          to: query.to,
        },
      });
      return validateHistory(unwrap(response, "Không thể tải lịch sử telemetry."));
    },
  };
}

export const telemetryService = createTelemetryService();
