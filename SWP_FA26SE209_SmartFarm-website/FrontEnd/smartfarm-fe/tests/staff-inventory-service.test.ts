import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffInventoryService } from "@/lib/api/staff/staff-inventory-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token", getRefreshToken: () => null, getExpiresAt: () => null,
  getPersistence: () => "session", setTokens: () => undefined, clear: () => undefined,
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), {
    status, headers: { "Content-Type": "application/json" },
  });
}

test("staff inventory service maps all six Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const balance = { supplyId: 5, supplyName: "Hạt cải", supplyType: "SEED", unit: "gói", onHand: 20, reserved: 2, available: 18, minStockLevel: 5, isLowStock: false };
  const movement = { movementId: 1, supplyId: 5, supplyName: "Hạt cải", movementType: "RECEIPT", quantity: 10, balanceAfter: 28, reason: "Nhập kho", orderId: null, createdByUserId: 2, createdAt: "2026-10-03T00:00:00Z" };
  const client = createApiClient({
    baseUrl: "http://localhost:5080", tokenStore,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ method: init?.method ?? "GET", path: url.pathname, query: url.search, body: init?.body ? JSON.parse(String(init.body)) as unknown : null, auth: new Headers(init?.headers).get("Authorization") ?? "" });
      if (url.pathname.endsWith("/reconciliation")) return jsonResponse([]);
      if (url.pathname.endsWith("/movements")) return jsonResponse({ items: [movement], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
      if (init?.method === "POST") return jsonResponse(movement, 201);
      if (url.pathname.endsWith("/inventory")) return jsonResponse({ items: [balance], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
      return jsonResponse(balance);
    },
  });
  const service = createStaffInventoryService(client);

  await service.list({ supplyType: "SEED", lowStock: true, search: "cải", page: 1, pageSize: 20 });
  await service.get(5);
  await service.receive(5, { quantity: 10, reason: "Nhập kho" });
  await service.use(5, { quantity: 2, reason: "Dùng cho lứa trồng" });
  await service.movements({ supplyId: 5, type: "RECEIPT", from: "2026-10-01", to: "2026-10-03", page: 1, pageSize: 20 });
  await service.reconciliation(5);

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "GET", path: "/api/v1/staff/inventory" },
    { method: "GET", path: "/api/v1/staff/inventory/5" },
    { method: "POST", path: "/api/v1/staff/inventory/5/receipts" },
    { method: "POST", path: "/api/v1/staff/inventory/5/usages" },
    { method: "GET", path: "/api/v1/staff/inventory/movements" },
    { method: "GET", path: "/api/v1/staff/inventory/reconciliation" },
  ]);
  assert.match(calls[0].query, /lowStock=true/);
  assert.deepEqual(calls[2].body, { quantity: 10, reason: "Nhập kho" });
  assert.deepEqual(calls[3].body, { quantity: 2, reason: "Dùng cho lứa trồng" });
  assert.match(calls[4].query, /type=RECEIPT/);
  assert.equal(calls[5].query, "?supplyId=5");
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
