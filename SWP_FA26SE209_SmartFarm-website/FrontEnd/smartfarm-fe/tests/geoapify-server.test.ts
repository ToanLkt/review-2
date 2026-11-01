import assert from "node:assert/strict";
import test from "node:test";

import { GeoapifyProxyError, requestGeoapify } from "@/lib/server/geoapify";

test("Geoapify proxy fails clearly when the server-only API key is missing", async () => {
  const previous = process.env.GEOAPIFY_API_KEY;
  delete process.env.GEOAPIFY_API_KEY;
  try {
    await assert.rejects(
      () => requestGeoapify("autocomplete", { text: "Thủ Đức" }),
      (error) => error instanceof GeoapifyProxyError
        && error.code === "GEOAPIFY_NOT_CONFIGURED"
        && error.status === 503,
    );
  } finally {
    if (previous === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previous;
  }
});

test("Geoapify proxy keeps the key server-side and applies Vietnamese search parameters", async () => {
  const previousKey = process.env.GEOAPIFY_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEOAPIFY_API_KEY = "test-server-only-key";
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return Response.json({ results: [] });
  };
  try {
    await requestGeoapify("autocomplete", {
      text: "Quận 1",
      filter: "countrycode:vn",
      bias: "countrycode:vn",
      limit: "5",
    });
    const parsedUrl = new URL(requestedUrl);
    assert.equal(parsedUrl.hostname, "api.geoapify.com");
    assert.equal(parsedUrl.pathname, "/v1/geocode/autocomplete");
    assert.equal(parsedUrl.searchParams.get("lang"), "vi");
    assert.equal(parsedUrl.searchParams.get("filter"), "countrycode:vn");
    assert.equal(parsedUrl.searchParams.get("bias"), "countrycode:vn");
    assert.equal(parsedUrl.searchParams.get("limit"), "5");
    assert.equal(parsedUrl.searchParams.get("apiKey"), "test-server-only-key");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previousKey;
  }
});

test("Geoapify proxy maps provider authorization, quota and 5xx failures", async (context) => {
  const previousKey = process.env.GEOAPIFY_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEOAPIFY_API_KEY = "test-server-only-key";
  try {
    for (const scenario of [
      { status: 401, code: "GEOAPIFY_UNAUTHORIZED", proxyStatus: 401 },
      { status: 403, code: "GEOAPIFY_FORBIDDEN", proxyStatus: 403 },
      { status: 429, code: "GEOAPIFY_RATE_LIMITED", proxyStatus: 429 },
      { status: 500, code: "GEOAPIFY_UNAVAILABLE", proxyStatus: 502 },
    ] as const) {
      await context.test(`HTTP ${scenario.status}`, async () => {
        globalThis.fetch = async () => new Response("provider error", { status: scenario.status });
        await assert.rejects(
          () => requestGeoapify("autocomplete", { text: "Quận 1" }),
          (error) => error instanceof GeoapifyProxyError
            && error.code === scenario.code
            && error.status === scenario.proxyStatus,
        );
      });
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = previousKey;
  }
});
