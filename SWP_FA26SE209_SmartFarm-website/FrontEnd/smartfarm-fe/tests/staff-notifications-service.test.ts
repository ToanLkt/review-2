import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffNotificationsService } from "@/lib/api/staff/staff-notifications-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token", getRefreshToken: () => null, getExpiresAt: () => null,
  getPersistence: () => "session", setTokens: () => undefined, clear: () => undefined,
};
const notification = { notificationId: 3, userId: 7, title: "Bảo trì", message: "22h", type: "GENERAL", referenceId: null, isRead: false, status: "DRAFT", scheduledAt: null, sentAt: null, createdAt: "2026-10-03T00:00:00Z" };
const template = { templateId: 2, templateKey: "ORDER_CREATED", titleTemplate: "Đơn mới", messageTemplate: "Đơn {code}", type: "ORDER", isActive: true, updatedAt: "2026-10-03T00:00:00Z", updatedByUserId: 2 };

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), { status: 200, headers: { "Content-Type": "application/json" } });
}

test("staff notification service maps all eleven Backend endpoints", async () => {
  const calls: { method: string; path: string; body: unknown; auth: string }[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080", tokenStore,
    fetcher: async (input, init) => {
      const path = new URL(String(input)).pathname;
      calls.push({ method: init?.method ?? "GET", path, body: init?.body ? JSON.parse(String(init.body)) as unknown : null, auth: new Headers(init?.headers).get("Authorization") ?? "" });
      if (path.endsWith("/broadcast")) return jsonResponse({ target: "ALL", role: null, recipients: 5, status: "SENT", scheduledAt: null });
      if (path.endsWith("/templates") && init?.method === "GET") return jsonResponse([template]);
      if (path.includes("/templates/")) return jsonResponse(template);
      if (path.endsWith("/templates")) return jsonResponse(template);
      if (path.endsWith("/notifications") && init?.method === "GET") return jsonResponse({ items: [notification], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
      return jsonResponse(notification);
    },
  });
  const service = createStaffNotificationsService(client);
  const createBody = { userId: 7, title: "Bảo trì", message: "22h", type: "GENERAL" as const, referenceId: null, scheduledAt: null };
  const templateBody = { templateKey: "ORDER_CREATED", titleTemplate: "Đơn mới", messageTemplate: "Đơn {code}", type: "ORDER" as const, isActive: true };

  await service.list({ status: "DRAFT", userId: 7, page: 1, pageSize: 20 });
  await service.create(createBody);
  await service.broadcast({ target: "ALL", role: null, title: "Bảo trì", message: "22h", type: "GENERAL", scheduledAt: null });
  await service.send(3);
  await service.schedule(3, "2026-10-04T00:00:00Z");
  await service.update(3, { userId: 7, title: "Mới", message: "Nội dung", type: "GENERAL", referenceId: null });
  await service.delete(3);
  await service.templates();
  await service.createTemplate(templateBody);
  await service.updateTemplate(2, templateBody);
  await service.deleteTemplate(2);

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "GET", path: "/api/v1/staff/notifications" },
    { method: "POST", path: "/api/v1/staff/notifications" },
    { method: "POST", path: "/api/v1/staff/notifications/broadcast" },
    { method: "POST", path: "/api/v1/staff/notifications/3/send" },
    { method: "PUT", path: "/api/v1/staff/notifications/3/schedule" },
    { method: "PUT", path: "/api/v1/staff/notifications/3" },
    { method: "DELETE", path: "/api/v1/staff/notifications/3" },
    { method: "GET", path: "/api/v1/staff/notifications/templates" },
    { method: "POST", path: "/api/v1/staff/notifications/templates" },
    { method: "PUT", path: "/api/v1/staff/notifications/templates/2" },
    { method: "DELETE", path: "/api/v1/staff/notifications/templates/2" },
  ]);
  assert.deepEqual(calls[4].body, { scheduledAt: "2026-10-04T00:00:00Z" });
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
