import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, createApiClient } from "@/lib/api/client";
import { createDeliveryPreviewService, getDeliveryAcceptanceError } from "@/lib/api/delivery-preview-service";

test("delivery preview sends coordinates and preserves an unknown distance", async () => {
  let requestedUrl: URL | null = null;
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async (input) => {
      requestedUrl = new URL(String(input));
      return new Response(JSON.stringify({
        success: true,
        message: null,
        data: { distanceKm: null, maxRadiusKm: 25, isOutOfRange: false, requiresAcceptance: false },
        errors: null,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });

  const preview = await createDeliveryPreviewService(client).getPreview(10.7712, 106.6983);

  assert.equal(preview.distanceKm, null);
  assert.equal(preview.maxRadiusKm, 25);
  assert.equal(requestedUrl && (requestedUrl as URL).pathname, "/api/v1/delivery/preview");
  assert.equal(requestedUrl && (requestedUrl as URL).searchParams.get("lat"), "10.7712");
  assert.equal(requestedUrl && (requestedUrl as URL).searchParams.get("lng"), "106.6983");
});

test("delivery acceptance metadata is read from the error envelope", () => {
  const response = {
    success: false,
    message: "Outside radius",
    data: null,
    errors: { distanceKm: 12.345, requiresAcceptance: true },
  };
  const error = new ApiError("Outside radius", 422, response, response);

  assert.deepEqual(getDeliveryAcceptanceError(error), {
    distanceKm: 12.345,
    requiresAcceptance: true,
  });
});

test("delivery preview rejects invalid coordinates before calling Backend", async () => {
  let calls = 0;
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async () => {
      calls += 1;
      return Response.json({ success: true, message: null, data: null, errors: null });
    },
  });

  await assert.rejects(
    () => createDeliveryPreviewService(client).getPreview(95, 106.7),
    (error) => error instanceof ApiError && error.status === 400,
  );
  assert.equal(calls, 0);
});

test("delivery preview rejects malformed OSRM preview data", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    fetcher: async () => Response.json({
      success: true,
      message: null,
      data: { distanceKm: -1, maxRadiusKm: 10, isOutOfRange: false, requiresAcceptance: false },
      errors: null,
    }),
  });

  await assert.rejects(
    () => createDeliveryPreviewService(client).getPreview(10.77, 106.69),
    (error) => error instanceof ApiError && error.status === 502,
  );
});
