import assert from "node:assert/strict";
import test from "node:test";

import {
  clearGeocodingCacheForTests,
  createGeocodingService,
  GeocodingError,
  normalizeAddressQuery,
} from "@/lib/geocoding-service";

const geoapifyResult = {
  place_id: "51f0",
  formatted: "Quận 1, Thành phố Hồ Chí Minh, Việt Nam",
  address_line1: "Quận 1",
  address_line2: "Thành phố Hồ Chí Minh, Việt Nam",
  district: "Quận 1",
  city: "Thành phố Hồ Chí Minh",
  state: "Thành phố Hồ Chí Minh",
  lat: 10.7756,
  lon: 106.7019,
  result_type: "district",
};

test("Geoapify autocomplete uses the internal proxy and caches normalized queries", async () => {
  clearGeocodingCacheForTests();
  const calls: URL[] = [];
  const service = createGeocodingService(async (input) => {
    calls.push(new URL(String(input), "http://localhost"));
    return Response.json({ results: [geoapifyResult] });
  });

  const first = await service.search("  Quận 1, TP HCM  ");
  const cached = await service.search("quận 1,   tp hcm");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].pathname, "/api/geocoding/autocomplete");
  assert.equal(calls[0].searchParams.get("text"), "Quận 1, TP HCM");
  assert.equal(calls[0].searchParams.has("apiKey"), false);
  assert.equal(first[0].latitude, 10.7756);
  assert.equal(first[0].title, "Quận 1");
  assert.equal(first[0].context, "Thành phố Hồ Chí Minh");
  assert.deepEqual(cached, first);
});

test("geocoding normalizes Vietnamese Unicode and whitespace", () => {
  assert.equal(normalizeAddressQuery("  Thủ   Đức  "), "Thủ Đức");
  assert.equal(normalizeAddressQuery("quan 1,   tp.hcm"), "quan 1, tp.hcm");
});

test("autocomplete forwards common accented and unaccented Vietnamese searches", async () => {
  clearGeocodingCacheForTests();
  const queries: string[] = [];
  const service = createGeocodingService(async (input) => {
    queries.push(new URL(String(input), "http://localhost").searchParams.get("text") ?? "");
    return Response.json({ results: [] });
  });

  for (const query of ["Thủ Đức", "Quận 1", "Nguyễn Huệ", "Linh Trung", "Ho Chi Minh"]) {
    await service.search(query);
  }

  assert.deepEqual(queries, ["Thủ Đức", "Quận 1", "Nguyễn Huệ", "Linh Trung", "Ho Chi Minh"]);
});

test("Geoapify reverse geocoding preserves coordinates and caches the point", async () => {
  clearGeocodingCacheForTests();
  const calls: URL[] = [];
  const service = createGeocodingService(async (input) => {
    calls.push(new URL(String(input), "http://localhost"));
    return Response.json({ results: [{
      ...geoapifyResult,
      formatted: "Phường Linh Trung, Thành phố Hồ Chí Minh, Việt Nam",
      address_line1: "Phường Linh Trung",
      lat: 10.8491,
      lon: 106.7537,
    }] });
  });

  const first = await service.reverse(10.8491, 106.7537);
  const cached = await service.reverse(10.8491, 106.7537);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].pathname, "/api/geocoding/reverse");
  assert.equal(calls[0].searchParams.get("lat"), "10.8491");
  assert.equal(calls[0].searchParams.get("lng"), "106.7537");
  assert.equal(first?.latitude, 10.8491);
  assert.deepEqual(cached, first);
});

test("geocoding reports missing configuration, quota and timeout codes", async (context) => {
  for (const scenario of [
    { status: 503, providerCode: "GEOAPIFY_NOT_CONFIGURED", expected: "NOT_CONFIGURED" },
    { status: 429, providerCode: "GEOAPIFY_RATE_LIMITED", expected: "RATE_LIMITED" },
    { status: 504, providerCode: "GEOAPIFY_TIMEOUT", expected: "TIMEOUT" },
  ] as const) {
    await context.test(scenario.providerCode, async () => {
      clearGeocodingCacheForTests();
      const service = createGeocodingService(async () => Response.json(
        { code: scenario.providerCode, message: "provider error" },
        { status: scenario.status },
      ));
      await assert.rejects(
        () => service.search(`Địa chỉ ${scenario.status}`),
        (error) => error instanceof GeocodingError
          && error.code === scenario.expected
          && error.status === scenario.status,
      );
    });
  }
});

test("an aborted autocomplete cannot update with an old result", async () => {
  clearGeocodingCacheForTests();
  const service = createGeocodingService(async (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
  }));
  const controller = new AbortController();
  const pending = service.search("Nguyễn Huệ", { signal: controller.signal });
  controller.abort(new DOMException("superseded", "AbortError"));

  await assert.rejects(
    () => pending,
    (error) => error instanceof GeocodingError && error.code === "ABORTED",
  );
});
