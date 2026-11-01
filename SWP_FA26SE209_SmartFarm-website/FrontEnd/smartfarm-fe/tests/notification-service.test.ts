import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createNotificationService } from "@/lib/api/notification-service";

const notification = {
  notificationId: 12,
  userId: 7,
  title: "Đơn hàng đã xác nhận",
  message: "Đơn hàng của bạn đã được xác nhận.",
  type: "ORDER",
  referenceId: 25,
  isRead: false,
  status: "SENT",
  scheduledAt: null,
  sentAt: "2026-10-03T08:00:00Z",
  createdAt: "2026-10-03T07:59:00Z",
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("notification service uses backend paging, unread filter and mark-read endpoint", async () => {
  const calls: { url: URL; method: string; authorization: string }[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: {
      getAccessToken: () => "access-token",
      getRefreshToken: () => null,
      getExpiresAt: () => null,
      getPersistence: () => "local",
      setTokens: () => undefined,
      clear: () => undefined,
    },
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ url, method: init?.method ?? "GET", authorization: new Headers(init?.headers).get("Authorization") ?? "" });
      if (init?.method === "PATCH") return jsonResponse({ ...notification, isRead: true });
      return jsonResponse({ items: [notification], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 });
    },
  });
  const service = createNotificationService(client);

  const page = await service.getNotifications({ isRead: false, page: 2, pageSize: 10 });
  const marked = await service.markAsRead(12);
  const unreadCount = await service.getUnreadCount();

  assert.equal(page.items[0].notificationId, 12);
  assert.equal(calls[0].url.searchParams.get("isRead"), "false");
  assert.equal(calls[0].url.searchParams.get("Page"), "2");
  assert.equal(calls[0].url.searchParams.get("PageSize"), "10");
  assert.equal(calls[1].url.pathname, "/api/v1/notifications/12/read");
  assert.equal(calls[1].method, "PATCH");
  assert.equal(marked.isRead, true);
  assert.equal(unreadCount, 11);
  assert.equal(calls[2].url.searchParams.get("isRead"), "false");
  assert.equal(calls[2].url.searchParams.get("PageSize"), "1");
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});
