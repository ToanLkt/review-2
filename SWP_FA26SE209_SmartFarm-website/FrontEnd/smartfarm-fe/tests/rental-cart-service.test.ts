import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createRentalCartService } from "@/lib/api/rental-cart-service";

const cart = {
  cartId: 5,
  items: [{
    cartItemId: 10,
    seedVarietyId: 1,
    seedVarietyName: "Rau muống mầm",
    farmAreaId: 2,
    farmAreaName: "Khu A",
    quantity: 1,
    totalCycles: 2,
    targetPlantingDate: "2026-10-10T00:00:00Z",
    rentalPrice: 20_000,
    lineTotal: 40_000,
    addedAt: "2026-10-03T10:00:00Z",
  }],
  itemCount: 1,
  subtotal: 40_000,
  discountPercent: 0,
  discountAmount: 0,
  total: 40_000,
};

const order = {
  orderId: 17,
  orderCode: "RENT-17",
  orderType: "TRAY_RENTAL",
  status: "AWAITING_PAYMENT",
  totalAmount: 20_000,
  createdAt: "2026-10-03T10:00:00Z",
  paymentDueAt: "2026-10-04T10:00:00Z",
  rentals: [],
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({
    success: true,
    message: null,
    data,
    errors: null,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({
    success: false,
    message,
    data: null,
    errors: null,
  }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("rental cart service maps all Backend cart endpoints", async () => {
  const calls: { method: string; path: string; body: string; authorization: string }[] = [];
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
        method: init?.method ?? "GET",
        path: url.pathname,
        body: String(init?.body ?? ""),
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
      });
      return jsonResponse(url.pathname.endsWith("/cart/checkout") ? order : cart);
    },
  });
  const service = createRentalCartService(client);

  assert.equal((await service.getCart()).cartId, 5);
  await service.addItem({ seedVarietyId: 1, farmAreaId: 2, totalCycles: 2, targetPlantingDate: null });
  await service.removeItem(10);
  await service.clearCart();
  assert.equal((await service.checkout({ isRiskAccepted: true, shippingAddress: "HCM", shippingLatitude: 10.77, shippingLongitude: 106.69, isAccepted: false, cartItemIds: [10] })).orderId, 17);

  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", "/api/v1/cart"],
    ["POST", "/api/v1/cart/items"],
    ["DELETE", "/api/v1/cart/items/10"],
    ["DELETE", "/api/v1/cart"],
    ["POST", "/api/v1/cart/checkout"],
  ]);
  assert.deepEqual(JSON.parse(calls[1].body), {
    seedVarietyId: 1,
    farmAreaId: 2,
    totalCycles: 2,
    targetPlantingDate: null,
  });
  assert.deepEqual(JSON.parse(calls[4].body), { isRiskAccepted: true, shippingAddress: "HCM", shippingLatitude: 10.77, shippingLongitude: 106.69, isAccepted: false, cartItemIds: [10] });
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});

test("rental cart adds three tray requests sequentially without merging duplicate seeds", async () => {
  let itemCount = 0;
  let activePosts = 0;
  let maxActivePosts = 0;
  const calls: { method: string; body: string }[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async (_input, init) => {
      const method = init?.method ?? "GET";
      calls.push({ method, body: String(init?.body ?? "") });
      if (method === "POST") {
        activePosts += 1;
        maxActivePosts = Math.max(maxActivePosts, activePosts);
        await Promise.resolve();
        itemCount += 1;
        activePosts -= 1;
      }
      return jsonResponse({ ...cart, itemCount, items: [] });
    },
  });
  const service = createRentalCartService(client);
  const progress: number[] = [];
  const result = await service.addItemsSequentially([
    { seedVarietyId: 1, farmAreaId: null, totalCycles: 1 },
    { seedVarietyId: 2, farmAreaId: null, totalCycles: 2 },
    { seedVarietyId: 1, farmAreaId: null, totalCycles: 3 },
  ], {
    initialCart: { ...cart, itemCount: 0, items: [] },
    onProgress: ({ completed }) => progress.push(completed),
  });

  assert.equal(result.addedCount, 3);
  assert.equal(result.remainingRequests.length, 0);
  assert.equal(result.cart.itemCount, 3);
  assert.equal(maxActivePosts, 1);
  assert.deepEqual(calls.map((call) => call.method), ["POST", "POST", "POST", "GET"]);
  assert.deepEqual(calls.slice(0, 3).map((call) => JSON.parse(call.body)), [
    { seedVarietyId: 1, farmAreaId: null, totalCycles: 1 },
    { seedVarietyId: 2, farmAreaId: null, totalCycles: 2 },
    { seedVarietyId: 1, farmAreaId: null, totalCycles: 3 },
  ]);
  assert.equal(progress.at(-1), 3);
});

test("rental cart stops after the second request fails and synchronizes confirmed items", async () => {
  let postCount = 0;
  const calls: string[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async (_input, init) => {
      const method = init?.method ?? "GET";
      calls.push(method);
      if (method === "POST") {
        postCount += 1;
        if (postCount === 2) return errorResponse(500, "Temporary failure");
        return jsonResponse({ ...cart, itemCount: 1, items: [] });
      }
      return jsonResponse({ ...cart, itemCount: 1, items: [] });
    },
  });
  const service = createRentalCartService(client);
  const requests = [
    { seedVarietyId: 1, farmAreaId: null, totalCycles: 1 },
    { seedVarietyId: 2, farmAreaId: null, totalCycles: 1 },
    { seedVarietyId: 3, farmAreaId: null, totalCycles: 1 },
  ];
  const result = await service.addItemsSequentially(requests, {
    initialCart: { ...cart, itemCount: 0, items: [] },
  });

  assert.equal(result.addedCount, 1);
  assert.deepEqual(result.remainingRequests, requests.slice(1));
  assert.equal(result.synchronizationFailed, false);
  assert.ok(result.error instanceof Error);
  assert.deepEqual(calls, ["POST", "POST", "GET"]);
});

test("rental cart checkout keeps Backend HTTP 409", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async () => errorResponse(409, "Not enough available trays for the cart."),
  });
  const service = createRentalCartService(client);

  await assert.rejects(
    () => service.checkout({ isRiskAccepted: true, shippingAddress: "HCM", shippingLatitude: 10.77, shippingLongitude: 106.69, isAccepted: false, cartItemIds: [10] }),
    (error: unknown) => error instanceof Error
      && "status" in error
      && error.status === 409,
  );
});
