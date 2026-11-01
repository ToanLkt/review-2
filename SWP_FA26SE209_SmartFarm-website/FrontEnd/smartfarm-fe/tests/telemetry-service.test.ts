import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createTelemetryService } from "@/lib/api/telemetry-service";

const reading = {
  messageId: "msg-1",
  deviceCode: "device-1",
  recordedAt: "2026-10-02T10:00:00Z",
  temperature: 24.5,
  airHumidity: 68,
  soilHumidity: 61,
  lightIntensity: 900,
  waterLevel: null,
  fanState: true,
  ledState: false,
  pumpState: null,
  isStale: false,
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("telemetry service maps rental id, latest, history range and pagination", async () => {
  const calls: { url: URL; authorization: string }[] = [];
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
      calls.push({ url, authorization: new Headers(init?.headers).get("Authorization") ?? "" });
      if (url.pathname.endsWith("/latest")) return jsonResponse(reading);
      return jsonResponse({ items: [reading], page: 2, pageSize: 20, totalItems: 21, totalPages: 2 });
    },
  });
  const service = createTelemetryService(client);
  const from = new Date("2026-10-01T00:00:00Z");
  const to = new Date("2026-10-02T00:00:00Z");

  const latest = await service.getLatest(14);
  const history = await service.getHistory(14, { search: "device", sort: "recordedAt desc", page: 2, pageSize: 20, from, to });

  assert.equal(latest.temperature, 24.5);
  assert.equal(latest.fanState, true);
  assert.equal(latest.isStale, false);
  assert.equal(history.items[0].soilHumidity, 61);
  assert.equal(calls[0].url.pathname, "/api/v1/rentals/14/telemetry/latest");
  assert.equal(calls[1].url.pathname, "/api/v1/rentals/14/telemetry/history");
  assert.equal(calls[1].url.searchParams.get("from"), from.toISOString());
  assert.equal(calls[1].url.searchParams.get("to"), to.toISOString());
  assert.equal(calls[1].url.searchParams.get("Page"), "2");
  assert.equal(calls[1].url.searchParams.get("PageSize"), "20");
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});
