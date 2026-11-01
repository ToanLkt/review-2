import assert from "node:assert/strict";
import test from "node:test";

import { createCameraService, resolveCameraImageUrl } from "@/lib/api/camera-service";
import { createApiClient } from "@/lib/api/client";

const snapshot = {
  snapshotId: 44,
  deviceId: 3,
  rentalId: 17,
  imageUrl: "/camera/snapshot-44.jpg",
  takenAt: "2026-10-03T08:00:00Z",
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("camera service loads latest and paged history by rental id", async () => {
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
      if (url.pathname.endsWith("/latest")) return jsonResponse(snapshot);
      return jsonResponse({ items: [snapshot], page: 2, pageSize: 6, totalItems: 7, totalPages: 2 });
    },
  });
  const service = createCameraService(client);

  const latest = await service.getLatest(17);
  const history = await service.getHistory(17, { page: 2, pageSize: 6 });

  assert.equal(latest.snapshotId, 44);
  assert.equal(calls[0].url.pathname, "/api/v1/rentals/17/camera/latest");
  assert.equal(calls[1].url.pathname, "/api/v1/rentals/17/camera/history");
  assert.equal(calls[1].url.searchParams.get("Page"), "2");
  assert.equal(calls[1].url.searchParams.get("PageSize"), "6");
  assert.equal(history.totalItems, 7);
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});

test("camera image resolver preserves absolute URLs", () => {
  assert.equal(resolveCameraImageUrl("https://cdn.example.com/image.jpg"), "https://cdn.example.com/image.jpg");
});
