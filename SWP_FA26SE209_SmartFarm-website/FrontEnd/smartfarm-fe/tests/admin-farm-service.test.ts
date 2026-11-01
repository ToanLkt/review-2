import assert from "node:assert/strict";
import test from "node:test";
import { createAdminFarmService } from "@/lib/api/admin/admin-farm-service";
import { createApiClient } from "@/lib/api/client";
import type { TokenStore } from "@/lib/api/token-storage";

const tokens: TokenStore = { getAccessToken: () => "admin-token", getRefreshToken: () => null, getExpiresAt: () => null, getPersistence: () => "session", setTokens: () => undefined, clear: () => undefined };
const response = (data: unknown) => new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), { status: 200, headers: { "Content-Type": "application/json" } });

test("admin farm service maps all fifteen Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const zone = { zoneId: 1, zoneName: "Khu A", locationDescription: "Nhà kính", totalCapacity: 40, isActive: true, rackCount: 1, trayCount: 1, availableTrays: 1 };
  const rack = { rackId: 2, zoneId: 1, rackCode: "A-R01", totalTiers: 4, maxTraysPerTier: 10 };
  const tray = { soilTrayId: 3, rackId: 2, trayCode: "A-001", tierIndex: 1, currentStatus: "AVAILABLE" };
  const client = createApiClient({ baseUrl: "http://localhost:5080", tokenStore: tokens, fetcher: async (input, init) => {
    const url = new URL(String(input)); const body = init?.body ? JSON.parse(String(init.body)) as unknown : null;
    calls.push({ method: init?.method ?? "GET", path: url.pathname, query: url.search, body, auth: new Headers(init?.headers).get("Authorization") ?? "" });
    if (url.pathname.endsWith("/zones")) return response(init?.method === "GET" ? [zone] : zone);
    if (url.pathname.endsWith("/zones/1")) return response(zone);
    if (url.pathname.endsWith("/racks")) return response(init?.method === "GET" ? [rack] : rack);
    if (url.pathname.endsWith("/trays")) return response(init?.method === "GET" ? [tray] : tray);
    return response(tray);
  } });
  const service = createAdminFarmService(client);
  const zoneBody = { zoneName: "Khu A", locationDescription: "Nhà kính", totalCapacity: 40, isActive: true };
  const rackBody = { zoneId: 1, rackCode: "A-R01", totalTiers: 4, maxTraysPerTier: 10 };
  const trayBody = { rackId: 2, trayCode: "A-001", tierIndex: 1, currentStatus: "AVAILABLE" as const };
  await service.zones(); await service.zone(1); await service.createZone(zoneBody); await service.updateZone(1, zoneBody); await service.deactivateZone(1);
  await service.racks(1); await service.createRack(rackBody); await service.updateRack(2, rackBody); await service.deleteRack(2);
  await service.trays({ rackId: 2, status: "AVAILABLE" }); await service.createTray(trayBody); await service.updateTray(3, trayBody);
  await service.updateTrayStatus(3, "MAINTENANCE"); await service.moveTray(3, { rackId: 2, tierIndex: 2 }); await service.deleteTray(3);
  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    "GET /api/v1/admin/farm/zones", "GET /api/v1/admin/farm/zones/1", "POST /api/v1/admin/farm/zones", "PUT /api/v1/admin/farm/zones/1", "DELETE /api/v1/admin/farm/zones/1",
    "GET /api/v1/admin/farm/racks", "POST /api/v1/admin/farm/racks", "PUT /api/v1/admin/farm/racks/2", "DELETE /api/v1/admin/farm/racks/2",
    "GET /api/v1/admin/farm/trays", "POST /api/v1/admin/farm/trays", "PUT /api/v1/admin/farm/trays/3", "PUT /api/v1/admin/farm/trays/3/status", "PUT /api/v1/admin/farm/trays/3/location", "DELETE /api/v1/admin/farm/trays/3",
  ]);
  assert.equal(calls[5].query, "?zoneId=1"); assert.match(calls[9].query, /status=AVAILABLE/);
  assert.deepEqual(calls[12].body, { status: "MAINTENANCE" }); assert.deepEqual(calls[13].body, { rackId: 2, tierIndex: 2 });
  assert.ok(calls.every((call) => call.auth === "Bearer admin-token"));
});

test("admin farm service recovers writes committed before a Backend 500 response", async () => {
  const calls: string[] = [];
  const zone = { zoneId: 3, zoneName: "Rau", locationDescription: "Nhà kính", totalCapacity: 16, isActive: true, rackCount: 1, trayCount: 1, availableTrays: 1 };
  const rack = { rackId: 2, zoneId: 3, rackCode: "Kệ 02", totalTiers: 2, maxTraysPerTier: 4 };
  const tray = { soilTrayId: 4, rackId: 2, trayCode: "KH-04", tierIndex: 1, currentStatus: "AVAILABLE" };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      calls.push(`${method} ${url.pathname}`);
      if (method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Internal server error", data: null, errors: null }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
      if (url.pathname.endsWith("/zones")) return response([zone]);
      if (url.pathname.endsWith("/racks")) return response([rack]);
      return response([tray]);
    },
  });
  const service = createAdminFarmService(client);

  assert.equal((await service.createZone({ zoneName: "Rau", locationDescription: "Nhà kính", totalCapacity: 16, isActive: true })).zoneId, 3);
  assert.equal((await service.createRack({ zoneId: 3, rackCode: "Kệ 02", totalTiers: 2, maxTraysPerTier: 4 })).rackId, 2);
  assert.equal((await service.createTray({ rackId: 2, trayCode: "KH-04", tierIndex: 1, currentStatus: "AVAILABLE" })).soilTrayId, 4);
  assert.deepEqual(calls, [
    "POST /api/v1/admin/farm/zones", "GET /api/v1/admin/farm/zones",
    "POST /api/v1/admin/farm/racks", "GET /api/v1/admin/farm/racks",
    "POST /api/v1/admin/farm/trays", "GET /api/v1/admin/farm/trays",
  ]);
});
