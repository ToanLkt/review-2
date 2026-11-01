import assert from "node:assert/strict";
import test from "node:test";
import { createAdminFarmConfigService, type FarmConfigRequest } from "@/lib/api/admin/admin-farm-config-service";
import { createApiClient } from "@/lib/api/client";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "admin-token", getRefreshToken: () => null,
  getExpiresAt: () => null, getPersistence: () => "session",
  setTokens: () => undefined, clear: () => undefined,
};

test("farm config reads and updates the backend contract", async () => {
  const request: FarmConfigRequest = {
    farmName: "SmartFarm", maxPreOrderDays: 7, standardTraySize: "32x24x4 cm",
    maxDeliveryRadiusKm: 10, discountCycleThreshold: 3, discountTrayThreshold: 3,
    loyalOrderThreshold: 5, standardDiscountPercent: 10, loyalDiscountPercent: 15,
    bankAccountNumber: null, bankName: null, bankOwnerName: null,
  };
  const calls: { method: string; path: string; body: unknown; authorization: string | null }[] = [];
  const client = createApiClient({ baseUrl: "http://localhost:5080", tokenStore, fetcher: async (input, init) => {
    calls.push({ method: init?.method ?? "GET", path: new URL(String(input)).pathname,
      body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
      authorization: new Headers(init?.headers).get("Authorization") });
    return new Response(JSON.stringify({ success: true, message: "OK", data: { configId: 1, ...request, updatedAt: "2026-10-17T00:00:00Z" }, errors: null }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  } });
  const service = createAdminFarmConfigService(client);
  assert.equal((await service.get()).configId, 1);
  assert.equal((await service.update(request)).farmName, "SmartFarm");
  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), ["GET /api/v1/admin/farm-config", "PUT /api/v1/admin/farm-config"]);
  assert.deepEqual(calls[1].body, request);
  assert.ok(calls.every(({ authorization }) => authorization === "Bearer admin-token"));
});
