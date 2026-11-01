import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createSeedService } from "@/lib/api/seed-service";

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("seed service maps search, pagination, detail and available tray endpoints", async () => {
  const calls: { url: URL; authorization: string }[] = [];
  const seed = {
    seedVarietyId: 1,
    name: "Rau muống mầm",
    description: "Mô tả",
    growthDays: 10,
    rentalPricePerTray: 65000,
    salePricePerPacket: 25000,
    riskDescription: "Tránh tưới quá nhiều.",
    expectedYield: "250 g/khay",
    standardTraySize: "32x24x4 cm",
  };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({
        url,
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (url.pathname.endsWith("/available/count")) return jsonResponse({ available: 4 });
      if (url.pathname.endsWith("/trays/available")) {
        return jsonResponse({ items: [], page: 1, pageSize: 1, totalItems: 4, totalPages: 4 });
      }
      if (url.pathname.endsWith("/seed-varieties/1")) return jsonResponse(seed);
      return jsonResponse({ items: [seed], page: 2, pageSize: 9, totalItems: 10, totalPages: 2 });
    },
  });
  const service = createSeedService(client);

  const list = await service.getSeedVarieties({ search: "rau", page: 2, pageSize: 9 });
  const detail = await service.getSeedVariety(1);
  const available = await service.getAvailableTrays({
    farmAreaId: 3,
    expand: "farmArea",
    page: 1,
    pageSize: 1,
  });
  const count = await service.getAvailableTrayCount(3);

  assert.equal(list.items[0].name, seed.name);
  assert.equal(list.items[0].riskDescription, "Tránh tưới quá nhiều.");
  assert.equal(detail.seedVarietyId, 1);
  assert.equal(detail.salePricePerPacket, 25000);
  assert.equal(detail.riskDescription, "Tránh tưới quá nhiều.");
  assert.equal(available.totalItems, 4);
  assert.equal(count.available, 4);
  assert.equal(calls[0].url.searchParams.get("Search"), "rau");
  assert.equal(calls[0].url.searchParams.get("Page"), "2");
  assert.equal(calls[0].url.searchParams.get("PageSize"), "9");
  assert.equal(calls[2].url.searchParams.get("farmAreaId"), "3");
  assert.equal(calls[2].url.searchParams.get("Expand"), "farmArea");
  assert.equal(calls[3].url.searchParams.get("farmAreaId"), "3");
  assert.ok(calls.every((call) => call.authorization === ""));
});

test("seed service surfaces Backend errors instead of returning incomplete risk data", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async () => new Response(JSON.stringify({
      success: false,
      message: "Không thể tải danh sách giống cây.",
      data: null,
      errors: null,
    }), { status: 200, headers: { "Content-Type": "application/json" } }),
  });

  await assert.rejects(
    () => createSeedService(client).getSeedVarieties(),
    /Không thể tải danh sách giống cây/,
  );
});
