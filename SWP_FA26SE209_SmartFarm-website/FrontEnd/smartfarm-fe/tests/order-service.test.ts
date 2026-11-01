import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createOrderService } from "@/lib/api/order-service";
import { canPayOrder, canScheduleOrderDelivery } from "@/lib/api/order-status";

const details = {
  orderId: 25,
  orderCode: "ORD-25",
  customerId: 7,
  customerName: "Customer",
  orderType: "SEED_PACKET",
  status: "AWAITING_PAYMENT",
  totalAmount: 90000,
  shippingAddress: "123 Test Street",
  createdAt: "2026-10-01T10:00:00Z",
  paymentDueAt: "2026-10-02T10:00:00Z",
  items: [],
  rentals: null,
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("order service maps seed order, list, detail, auth and pagination", async () => {
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
      calls.push({ url, body: String(init?.body ?? ""), authorization: new Headers(init?.headers).get("Authorization") ?? "" });
      if (init?.method === "POST") return jsonResponse(details);
      if (url.pathname.endsWith("/orders/25")) return jsonResponse(details);
      return jsonResponse({ items: [details], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 });
    },
  });
  const service = createOrderService(client);

  const created = await service.createSeedPacketOrder({ seedVarietyId: 4, quantity: 3, shippingAddress: "123 Test Street", shippingLatitude: 10.77, shippingLongitude: 106.69, isAccepted: false });
  const list = await service.getOrders({ search: "ORD", sort: "createdAt desc", page: 2, pageSize: 10 });
  const detail = await service.getOrder(25);

  assert.equal(created.orderId, 25);
  assert.deepEqual(JSON.parse(calls[0].body), { seedVarietyId: 4, quantity: 3, shippingAddress: "123 Test Street", shippingLatitude: 10.77, shippingLongitude: 106.69, isAccepted: false });
  assert.equal(list.items[0].orderCode, "ORD-25");
  assert.equal(calls[1].url.searchParams.get("Search"), "ORD");
  assert.equal(calls[1].url.searchParams.get("Sort"), "createdAt desc");
  assert.equal(calls[1].url.searchParams.get("Page"), "2");
  assert.equal(calls[1].url.searchParams.get("PageSize"), "10");
  assert.equal(detail.orderId, 25);
  assert.equal(canPayOrder(detail.status), true);
  assert.equal(canPayOrder("CONFIRMED"), false);
  assert.equal(canScheduleOrderDelivery("AWAITING_PAYMENT"), false);
  assert.equal(canScheduleOrderDelivery("CONFIRMED"), true);
  assert.equal(canScheduleOrderDelivery("PREPARING"), true);
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});
