import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffOrdersService } from "@/lib/api/staff/staff-orders-service";
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
  return new Response(
    JSON.stringify({ success: true, message: "OK", data, errors: null }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

test("staff order service maps all four Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const order = {
    orderId: 12,
    orderCode: "SP20261003",
    customerId: 5,
    customerName: "Khách hàng",
    orderType: "SEED_PACKET",
    status: "AWAITING_PAYMENT",
    totalAmount: 120000,
    shippingAddress: "Quận 1",
    createdAt: "2026-10-03T01:00:00Z",
    paymentDueAt: "2026-10-03T01:30:00Z",
    items: [],
    rentals: [],
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
      return jsonResponse(url.pathname.endsWith("/orders") || url.pathname.endsWith("/rentals")
        ? { items: [order], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
        : order);
    },
  });
  const service = createStaffOrdersService(client);

  await service.list({ search: "SP", orderType: "SEED_PACKET", status: "AWAITING_PAYMENT", page: 2, pageSize: 10 });
  await service.listRentals({ status: "CONFIRMED", page: 1, pageSize: 20 });
  await service.get(12);
  await service.updateStatus(12, "CONFIRMED");

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "GET", path: "/api/v1/staff/orders" },
    { method: "GET", path: "/api/v1/staff/orders/rentals" },
    { method: "GET", path: "/api/v1/staff/orders/12" },
    { method: "PATCH", path: "/api/v1/staff/orders/12/status" },
  ]);
  assert.match(calls[0].query, /orderType=SEED_PACKET/);
  assert.match(calls[0].query, /status=AWAITING_PAYMENT/);
  assert.deepEqual(calls[3].body, { status: "CONFIRMED" });
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
