import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createPublicFarmService } from "@/lib/api/public-farm-service";

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("public farm service maps farm info, public ratings and customer review", async () => {
  const calls: { method: string; url: URL; body: string }[] = [];
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({ method: init?.method ?? "GET", url, body: String(init?.body ?? "") });
      if (url.pathname.endsWith("/farm-info")) {
        return jsonResponse({ farmName: "SmartFarm", maxPreOrderDays: 7, standardTraySize: "50 × 30 cm", maxDeliveryRadiusKm: 15 });
      }
      if (url.pathname.endsWith("/farm-areas")) {
        return jsonResponse([{ farmAreaId: 3, name: "Khu A", description: "Nhà kính", totalCapacity: 50, totalTrays: 40, availableTrays: 12 }]);
      }
      const review = { reviewId: 9, orderId: 17, customerId: 3, customerName: "Lan", rating: 5, comment: "Tốt", createdAt: "2026-10-14T00:00:00Z" };
      if ((init?.method ?? "GET") === "POST") return jsonResponse(review);
      return jsonResponse({ averageRating: 4.8, totalReviews: 12, items: [review], page: 2, pageSize: 6, totalItems: 12 });
    },
  });
  const service = createPublicFarmService(client);

  assert.equal((await service.getInfo()).farmName, "SmartFarm");
  assert.equal((await service.getFarmAreas())[0].availableTrays, 12);
  assert.equal((await service.getRatings(2, 6)).items[0].rating, 5);
  assert.equal((await service.createReview(17, { rating: 5, comment: "Tốt" })).reviewId, 9);
  assert.equal(calls[1].url.pathname, "/api/v1/farm-areas");
  assert.equal(calls[2].url.searchParams.get("Page"), "2");
  assert.equal(calls[2].url.searchParams.get("PageSize"), "6");
  assert.equal(calls[3].url.pathname, "/api/v1/reviews/orders/17");
  assert.deepEqual(JSON.parse(calls[3].body), { rating: 5, comment: "Tốt" });
});
