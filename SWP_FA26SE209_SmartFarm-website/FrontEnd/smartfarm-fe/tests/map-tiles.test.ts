import assert from "node:assert/strict";
import test from "node:test";

import {
  MapTileError,
  parseMapTileCoordinates,
  requestMapTile,
} from "@/lib/server/map-tiles";

const pngResponse = () => new Response(new Uint8Array([137, 80, 78, 71]), {
  headers: { "Content-Type": "image/png" },
});

test("map tile coordinates reject invalid or out-of-range paths", () => {
  assert.deepEqual(parseMapTileCoordinates({ z: "16", x: "52202", y: "30780" }), {
    z: 16,
    x: 52202,
    y: 30780,
  });
  assert.throws(
    () => parseMapTileCoordinates({ z: "20", x: "1", y: "1" }),
    (error: unknown) => error instanceof MapTileError && error.status === 400,
  );
  assert.throws(
    () => parseMapTileCoordinates({ z: "2", x: "4", y: "0" }),
    (error: unknown) => error instanceof MapTileError && error.status === 400,
  );
});

test("map tile proxy keeps Geoapify key server-side", async () => {
  const previousKey = process.env.GEOAPIFY_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEOAPIFY_API_KEY = "server-only-map-key";
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return pngResponse();
  };
  try {
    const tile = await requestMapTile(16, 52202, 30780);
    const url = new URL(requestedUrl);
    assert.equal(url.hostname, "maps.geoapify.com");
    assert.equal(url.pathname, "/v1/tile/osm-carto/16/52202/30780.png");
    assert.equal(url.searchParams.get("apiKey"), "server-only-map-key");
    assert.equal(tile.contentType, "image/png");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previousKey;
  }
});

test("map tile proxy falls back to OpenStreetMap when Geoapify fails", async () => {
  const previousKey = process.env.GEOAPIFY_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEOAPIFY_API_KEY = "server-only-map-key";
  const requestedHosts: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    requestedHosts.push(url.hostname);
    return requestedHosts.length === 1
      ? new Response("provider unavailable", { status: 503 })
      : pngResponse();
  };
  try {
    await requestMapTile(16, 52202, 30780);
    assert.deepEqual(requestedHosts, ["maps.geoapify.com", "tile.openstreetmap.org"]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previousKey;
  }
});
