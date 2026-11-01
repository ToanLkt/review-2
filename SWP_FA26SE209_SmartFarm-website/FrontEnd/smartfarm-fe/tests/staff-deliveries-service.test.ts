import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffDeliveriesService } from "@/lib/api/staff/staff-deliveries-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token",
  getRefreshToken: () => null,
  getExpiresAt: () => null,
  getPersistence: () => "session",
  setTokens: () => undefined,
  clear: () => undefined,
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("staff delivery service maps all five Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const delivery = {
    deliveryId: 7,
    orderId: 12,
    orderCode: "SP20261003",
    rentalId: null,
    shipperId: null,
    shipperName: null,
    recipientName: "Khách hàng",
    recipientPhone: "0901234567",
    shippingAddress: "Quận 1",
    scheduledDeliveryAt: null,
    trackingCode: null,
    actualWeightKg: null,
    status: "PENDING",
    shippedAt: null,
    deliveredAt: null,
    notes: null,
  };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({
        method: init?.method ?? "GET",
        path: url.pathname,
        query: url.search,
        body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
        auth: new Headers(init?.headers).get("Authorization") ?? "",
      });
      return jsonResponse(init?.method === "GET" && url.pathname.endsWith("/deliveries")
        ? { items: [delivery], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
        : delivery);
    },
  });
  const service = createStaffDeliveriesService(client);

  await service.create({ orderId: 12, rentalId: null, recipientName: "Khách hàng", recipientPhone: "0901234567", shippingAddress: "Quận 1" });
  await service.list({ search: "SP", status: "PENDING", page: 1, pageSize: 20 });
  await service.get(7);
  await service.assignShipper(7, 2);
  await service.update(7, { status: "PACKAGED", trackingCode: "GHN-1", actualWeightKg: 1.5, notes: "Đã đóng gói" });

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "POST", path: "/api/v1/staff/deliveries" },
    { method: "GET", path: "/api/v1/staff/deliveries" },
    { method: "GET", path: "/api/v1/staff/deliveries/7" },
    { method: "PUT", path: "/api/v1/staff/deliveries/7/shipper" },
    { method: "PATCH", path: "/api/v1/staff/deliveries/7" },
  ]);
  assert.match(calls[1].query, /status=PENDING/);
  assert.deepEqual(calls[3].body, { shipperId: 2 });
  assert.deepEqual(calls[4].body, { status: "PACKAGED", trackingCode: "GHN-1", actualWeightKg: 1.5, notes: "Đã đóng gói" });
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
