import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createRentalService } from "@/lib/api/rental-service";

const order = {
  orderId: 17,
  orderCode: "RENT-17",
  orderType: "TRAY_RENTAL",
  status: "AWAITING_PAYMENT",
  totalAmount: 130000,
  createdAt: "2026-10-01T10:00:00Z",
  paymentDueAt: "2026-10-02T10:00:00Z",
  rentals: [],
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("rental service maps create, list, detail, auth and pagination", async () => {
  const calls: { url: URL; body: string; authorization: string }[] = [];
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
      calls.push({
        url,
        body: String(init?.body ?? ""),
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (init?.method === "POST") return jsonResponse(order);
      if (url.pathname.endsWith("/rentals/17")) return jsonResponse(order);
      return jsonResponse({ items: [order], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 });
    },
  });
  const service = createRentalService(client);

  const created = await service.createRental({
    seedVarietyId: 3,
    farmAreaId: 4,
    targetPlantingDate: "2026-10-20T00:00:00.000Z",
    targetDeliveryDate: null,
    isRiskAccepted: true,
    totalCycles: 2,
    shippingAddress: "123 Test Street",
    shippingLatitude: 10.77,
    shippingLongitude: 106.69,
    isAccepted: false,
  });
  const list = await service.getRentals({ search: "RENT", sort: "createdAt desc", page: 2, pageSize: 10 });
  const detail = await service.getRental(17);

  assert.equal(created.orderId, 17);
  assert.deepEqual(JSON.parse(calls[0].body), {
    seedVarietyId: 3,
    farmAreaId: 4,
    targetPlantingDate: "2026-10-20T00:00:00.000Z",
    targetDeliveryDate: null,
    isRiskAccepted: true,
    totalCycles: 2,
    shippingAddress: "123 Test Street",
    shippingLatitude: 10.77,
    shippingLongitude: 106.69,
    isAccepted: false,
    quantity: 1,
  });
  assert.equal(list.items[0].orderCode, "RENT-17");
  assert.equal(calls[1].url.searchParams.get("Search"), "RENT");
  assert.equal(calls[1].url.searchParams.get("Sort"), "createdAt desc");
  assert.equal(calls[1].url.searchParams.get("Page"), "2");
  assert.equal(calls[1].url.searchParams.get("PageSize"), "10");
  assert.equal(detail.orderId, 17);
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});
