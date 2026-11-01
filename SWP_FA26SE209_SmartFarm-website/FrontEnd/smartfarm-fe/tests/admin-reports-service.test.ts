import assert from "node:assert/strict";
import test from "node:test";
import { createAdminReportsService } from "@/lib/api/admin/admin-reports-service";
import { createApiClient } from "@/lib/api/client";
import type { TokenStore } from "@/lib/api/token-storage";

const tokens: TokenStore = {
  getAccessToken: () => "admin-token",
  getRefreshToken: () => null,
  getExpiresAt: () => null,
  getPersistence: () => "session",
  setTokens: () => undefined,
  clear: () => undefined,
};

const response = (data: unknown) =>
  new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

test("admin reports service maps all three report endpoints", async () => {
  const calls: { method: string; path: string; query: string; auth: string }[] = [];
  const revenue = {
    from: "2026-10-01T00:00:00Z",
    to: "2026-10-09T23:59:59Z",
    totalRevenue: 1200000,
    successfulPayments: 4,
    totalOrders: 5,
    revenueByOrderType: { TRAY_RENTAL: 800000, SEED_PACKET: 400000 },
    ordersByStatus: { CONFIRMED: 3, COMPLETED: 2 },
  };
  const harvest = {
    from: revenue.from,
    to: revenue.to,
    totalCycles: 10,
    harvestedCycles: 7,
    failedCycles: 1,
    completionRate: 70,
    bySupply: [{ supplyId: 1, supplyName: "Rau mầm", totalCycles: 6, harvestedCycles: 5 }],
  };
  const inventory = {
    totalSupplies: 8,
    lowStockSupplies: 2,
    totalOnHand: 120,
    totalReserved: 20,
    totalAvailable: 100,
    availableBySupplyType: { SEED: 70, EQUIPMENT: 30 },
  };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({
        method: init?.method ?? "GET",
        path: url.pathname,
        query: url.search,
        auth: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (url.pathname.endsWith("/revenue")) return response(revenue);
      if (url.pathname.endsWith("/harvest")) return response(harvest);
      return response(inventory);
    },
  });
  const service = createAdminReportsService(client);
  const range = {
    from: new Date("2026-10-01T00:00:00Z"),
    to: "2026-10-09T23:59:59Z",
  };

  assert.deepEqual(await service.revenue(range), revenue);
  assert.deepEqual(await service.harvest(range), harvest);
  assert.deepEqual(await service.inventory(), inventory);
  assert.deepEqual(
    calls.map(({ method, path }) => `${method} ${path}`),
    [
      "GET /api/v1/admin/reports/revenue",
      "GET /api/v1/admin/reports/harvest",
      "GET /api/v1/admin/reports/inventory",
    ],
  );
  assert.match(calls[0].query, /from=2026-10-01T00%3A00%3A00.000Z/);
  assert.match(calls[0].query, /to=2026-10-09T23%3A59%3A59.000Z/);
  assert.equal(calls[1].query, calls[0].query);
  assert.equal(calls[2].query, "");
  assert.ok(calls.every((call) => call.auth === "Bearer admin-token"));
});
