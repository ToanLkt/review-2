import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffTelemetryService } from "@/lib/api/staff/staff-telemetry-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token", getRefreshToken: () => null, getExpiresAt: () => null,
  getPersistence: () => "session", setTokens: () => undefined, clear: () => undefined,
};

const reading = {
  telemetryId: 15, messageId: "msg-15", deviceId: 4, deviceCode: "ESP32-A01", soilTrayId: 9,
  temperature: 28.5, airHumidity: 70.2, soilHumidity: 62.1, lightIntensity: 900,
  waterLevel: 45, recordedAt: "2026-10-03T04:00:00Z", isStale: false,
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

test("staff telemetry service maps latest and paged history endpoints", async () => {
  const calls: { method: string; url: URL; auth: string }[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080", tokenStore,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ method: init?.method ?? "GET", url, auth: new Headers(init?.headers).get("Authorization") ?? "" });
      return jsonResponse(url.pathname.endsWith("/latest")
        ? reading
        : { items: [reading], page: 2, pageSize: 20, totalItems: 21, totalPages: 2 });
    },
  });
  const service = createStaffTelemetryService(client);
  const from = new Date("2026-10-01T00:00:00Z");
  const to = new Date("2026-10-03T23:59:59Z");

  await service.latest(9);
  await service.history(9, { from, to, page: 2, pageSize: 20 });

  assert.deepEqual(calls.map((call) => ({ method: call.method, path: call.url.pathname })), [
    { method: "GET", path: "/api/v1/staff/telemetry/trays/9/latest" },
    { method: "GET", path: "/api/v1/staff/telemetry/trays/9/history" },
  ]);
  assert.equal(calls[1].url.searchParams.get("from"), from.toISOString());
  assert.equal(calls[1].url.searchParams.get("to"), to.toISOString());
  assert.equal(calls[1].url.searchParams.get("page"), "2");
  assert.equal(calls[1].url.searchParams.get("pageSize"), "20");
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
