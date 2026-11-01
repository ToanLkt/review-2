import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { PagedResult } from "./seed-service";
import type { ApiResponse } from "./types";

export const notificationsChangedEvent = "smartfarm:notifications-changed";

export type CustomerNotification = {
  notificationId: number;
  userId: number;
  title: string | null;
  message: string | null;
  type: string | null;
  referenceId: number | null;
  isRead: boolean;
  status: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type NotificationQuery = {
  isRead?: boolean;
  page?: number;
  pageSize?: number;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown) {
  return value === null || typeof value === "number";
}

function isNotification(value: unknown): value is CustomerNotification {
  if (!value || typeof value !== "object") return false;
  const notification = value as Record<string, unknown>;
  return typeof notification.notificationId === "number"
    && typeof notification.userId === "number"
    && isNullableString(notification.title)
    && isNullableString(notification.message)
    && isNullableString(notification.type)
    && isNullableNumber(notification.referenceId)
    && typeof notification.isRead === "boolean"
    && isNullableString(notification.status)
    && isNullableString(notification.scheduledAt)
    && isNullableString(notification.sentAt)
    && typeof notification.createdAt === "string";
}

function validateNotification(value: unknown, fallback: string) {
  if (!isNotification(value)) throw new ApiError(fallback, 200, null, value);
  return value;
}

function validatePage(value: unknown): PagedResult<CustomerNotification> {
  if (!value || typeof value !== "object") {
    throw new ApiError("Dữ liệu danh sách thông báo không hợp lệ.", 200, null, value);
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items)
    || typeof page.page !== "number"
    || typeof page.pageSize !== "number"
    || typeof page.totalItems !== "number"
    || typeof page.totalPages !== "number"
    || !page.items.every(isNotification)) {
    throw new ApiError("Dữ liệu danh sách thông báo không đúng contract phân trang.", 200, null, value);
  }
  return page as PagedResult<CustomerNotification>;
}

export function createNotificationService(client: ApiClient = apiClient) {
  return {
    async getNotifications(query: NotificationQuery = {}) {
      const response = await client.get<unknown>("/notifications", {
        query: {
          isRead: query.isRead,
          Page: query.page,
          PageSize: query.pageSize,
        },
      });
      return validatePage(unwrap(response, "Không thể tải danh sách thông báo."));
    },

    async getUnreadCount() {
      const result = await this.getNotifications({ isRead: false, page: 1, pageSize: 1 });
      return result.totalItems;
    },

    async markAsRead(notificationId: number) {
      const response = await client.patch<unknown>(`/notifications/${notificationId}/read`);
      return validateNotification(unwrap(response, "Không thể đánh dấu thông báo đã đọc."), "Dữ liệu thông báo không hợp lệ.");
    },
  };
}

export const notificationService = createNotificationService();
