import type { ApiClient } from "../client";

export const NOTIFICATION_STATUSES = ["DRAFT", "SCHEDULED", "SENT"] as const;
export const NOTIFICATION_TYPES = ["GENERAL", "ORDER", "PAYMENT", "DELIVERY", "GROWING_CYCLE"] as const;
export const BROADCAST_TARGETS = ["ALL", "ROLE"] as const;
export const BROADCAST_ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type BroadcastTarget = (typeof BROADCAST_TARGETS)[number];
export type BroadcastRole = (typeof BROADCAST_ROLES)[number];

export type StaffNotification = {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType | string;
  referenceId: number | null;
  isRead: boolean;
  status: NotificationStatus | string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type PagedStaffNotifications = {
  items: StaffNotification[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type NotificationTemplate = {
  templateId: number;
  templateKey: string;
  titleTemplate: string;
  messageTemplate: string;
  type: NotificationType | string;
  isActive: boolean;
  updatedAt: string;
  updatedByUserId: number | null;
};

export type NotificationQuery = {
  search?: string;
  status?: NotificationStatus;
  userId?: number;
  page?: number;
  pageSize?: number;
};

export type CreateNotificationRequest = {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  referenceId: number | null;
  scheduledAt: string | null;
};

export type UpdateNotificationRequest = Omit<CreateNotificationRequest, "scheduledAt">;

export type BroadcastNotificationRequest = {
  target: BroadcastTarget;
  role: BroadcastRole | null;
  title: string;
  message: string;
  type: NotificationType;
  scheduledAt: string | null;
};

export type BroadcastResult = {
  target: BroadcastTarget;
  role: BroadcastRole | null;
  recipients: number;
  status: "SENT" | "SCHEDULED";
  scheduledAt: string | null;
};

export type NotificationTemplateRequest = {
  templateKey: string;
  titleTemplate: string;
  messageTemplate: string;
  type: NotificationType;
  isActive: boolean;
};

export function createStaffNotificationsService(client: ApiClient) {
  return {
    async list(query: NotificationQuery = {}) {
      const response = await client.get<PagedStaffNotifications>("/staff/notifications", { query });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async create(request: CreateNotificationRequest) {
      const response = await client.post<StaffNotification, CreateNotificationRequest>("/staff/notifications", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async broadcast(request: BroadcastNotificationRequest) {
      const response = await client.post<BroadcastResult, BroadcastNotificationRequest>("/staff/notifications/broadcast", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async send(notificationId: number) {
      const response = await client.post<StaffNotification>(`/staff/notifications/${notificationId}/send`);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async schedule(notificationId: number, scheduledAt: string) {
      const response = await client.put<StaffNotification, { scheduledAt: string }>(`/staff/notifications/${notificationId}/schedule`, { scheduledAt });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async update(notificationId: number, request: UpdateNotificationRequest) {
      const response = await client.put<StaffNotification, UpdateNotificationRequest>(`/staff/notifications/${notificationId}`, request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async delete(notificationId: number) {
      await client.delete<unknown>(`/staff/notifications/${notificationId}`);
    },
    async templates() {
      const response = await client.get<NotificationTemplate[]>("/staff/notifications/templates");
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async createTemplate(request: NotificationTemplateRequest) {
      const response = await client.post<NotificationTemplate, NotificationTemplateRequest>("/staff/notifications/templates", request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async updateTemplate(templateId: number, request: NotificationTemplateRequest) {
      const response = await client.put<NotificationTemplate, NotificationTemplateRequest>(`/staff/notifications/templates/${templateId}`, request);
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
    async deleteTemplate(templateId: number) {
      await client.delete<unknown>(`/staff/notifications/templates/${templateId}`);
    },
  };
}
