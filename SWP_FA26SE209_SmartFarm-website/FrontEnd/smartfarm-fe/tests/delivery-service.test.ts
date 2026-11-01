import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createDeliveryService } from "@/lib/api/delivery-service";

const delivery = {
  deliveryId: 12,
  orderId: 25,
  orderCode: "ORD-25",
  rentalId: null,
  cycleNumber: 1,
  shipperId: null,
  shipperName: null,
  recipientName: "Customer",
  recipientPhone: "0900000000",
  shippingAddress: "123 Test Street",
  scheduledDeliveryAt: "2026-10-03T02:00:00Z",
  trackingCode: null,
  actualWeightKg: null,
  status: "PENDING",
  shippedAt: null,
  deliveredAt: null,
  notes: null,
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("delivery service maps list, detail, schedule DTO and auth", async () => {
  const calls: { url: URL; method: string; body: string; authorization: string }[] = [];
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
      calls.push({ url, method: init?.method ?? "GET", body: String(init?.body ?? ""), authorization: new Headers(init?.headers).get("Authorization") ?? "" });
      if (init?.method === "PUT") return jsonResponse(delivery);
      if (url.pathname.endsWith("/deliveries/12")) return jsonResponse(delivery);
      return jsonResponse({ items: [delivery], page: 2, pageSize: 8, totalItems: 9, totalPages: 2 });
    },
  });
  const service = createDeliveryService(client);

  const list = await service.getDeliveries({ search: "ORD", sort: "scheduledDeliveryAt desc", page: 2, pageSize: 8 });
  const detail = await service.getDelivery(12);
  const scheduled = await service.scheduleDelivery(25, {
    recipientName: "Customer",
    recipientPhone: "0900000000",
    shippingAddress: "123 Test Street",
    scheduledDeliveryAt: "2026-10-03T02:00:00.000Z",
    notes: null,
    shippingLatitude: 10.77,
    shippingLongitude: 106.69,
    isAccepted: false,
    cycleNumber: 1,
    deliveryId: 12,
  });
  const scheduledById = await service.scheduleDeliveryById(12, {
    recipientName: "Customer",
    recipientPhone: "0900000000",
    shippingAddress: "123 Test Street",
    scheduledDeliveryAt: "2026-10-03T02:00:00.000Z",
    notes: null,
    shippingLatitude: 10.77,
    shippingLongitude: 106.69,
    isAccepted: false,
    cycleNumber: 1,
    deliveryId: 12,
  });

  assert.equal(list.items[0].deliveryId, 12);
  assert.equal(calls[0].url.searchParams.get("Search"), "ORD");
  assert.equal(calls[0].url.searchParams.get("Sort"), "scheduledDeliveryAt desc");
  assert.equal(calls[0].url.searchParams.get("Page"), "2");
  assert.equal(calls[0].url.searchParams.get("PageSize"), "8");
  assert.equal(detail.orderId, 25);
  assert.equal(scheduled.status, "PENDING");
  assert.equal(scheduledById.deliveryId, 12);
  assert.deepEqual(JSON.parse(calls[2].body), {
    recipientName: "Customer",
    recipientPhone: "0900000000",
    shippingAddress: "123 Test Street",
    scheduledDeliveryAt: "2026-10-03T02:00:00.000Z",
    notes: null,
    shippingLatitude: 10.77,
    shippingLongitude: 106.69,
    isAccepted: false,
    cycleNumber: 1,
    deliveryId: 12,
  });
  assert.equal(calls[3].url.pathname, "/api/v1/deliveries/12/schedule");
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});
