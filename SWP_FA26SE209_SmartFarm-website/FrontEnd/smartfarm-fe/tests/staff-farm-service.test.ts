import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffFarmService } from "@/lib/api/staff/staff-farm-service";
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

test("staff farm service maps all five Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const tray = { soilTrayId: 9, rackId: 4, trayCode: "T-09", tierIndex: 2, currentStatus: "MAINTENANCE" };
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
      if (url.pathname.endsWith("/zones")) return jsonResponse([]);
      if (url.pathname.endsWith("/racks")) return jsonResponse([]);
      if (init?.method === "GET") return jsonResponse([tray]);
      return jsonResponse(tray);
    },
  });
  const service = createStaffFarmService(client);

  await service.zones();
  await service.racks(3);
  await service.trays({ rackId: 4, status: "AVAILABLE" });
  await service.createTray({ rackId: 4, trayCode: "T-09", tierIndex: 2, currentStatus: "AVAILABLE" });
  await service.updateTrayStatus(9, "MAINTENANCE");

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "GET", path: "/api/v1/staff/farm/zones" },
    { method: "GET", path: "/api/v1/staff/farm/racks" },
    { method: "GET", path: "/api/v1/staff/farm/trays" },
    { method: "POST", path: "/api/v1/staff/farm/trays" },
    { method: "PUT", path: "/api/v1/staff/farm/trays/9/status" },
  ]);
  assert.equal(calls[1].query, "?zoneId=3");
  assert.match(calls[2].query, /rackId=4/);
  assert.match(calls[2].query, /status=AVAILABLE/);
  assert.deepEqual(calls[3].body, { rackId: 4, trayCode: "T-09", tierIndex: 2, currentStatus: "AVAILABLE" });
  assert.deepEqual(calls[4].body, { status: "MAINTENANCE" });
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
