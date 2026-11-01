import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffPaymentsService } from "@/lib/api/staff/staff-payments-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token",
  getRefreshToken: () => null,
  getExpiresAt: () => null,
  getPersistence: () => "session",
  setTokens: () => undefined,
  clear: () => undefined,
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("staff payment service maps exceptions, note and report endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const exception = {
    eventId: 8,
    sePayTransactionId: 10008,
    orderId: 12,
    paymentId: 4,
    paymentCode: "SP20261003",
    referenceCode: "FT123",
    amount: 90000,
    exceptionType: "UNDERPAID",
    transactionAt: "2026-10-03T01:00:00Z",
    staffNote: null,
    reviewedByUserId: null,
    reviewedAt: null,
  };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      calls.push({
        method: init?.method ?? "GET",
        path: url.pathname,
        query: url.search,
        body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
        auth: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (url.pathname.endsWith("/exceptions")) {
        return jsonResponse({ items: [exception], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 });
      }
      if (url.pathname.endsWith("/report")) {
        return jsonResponse({ totalTransactions: 20, totalReceived: 1000000, successful: 15, exceptions: 5, exceptionsByType: { UNDERPAID: 2 } });
      }
      return jsonResponse({ ...exception, staffNote: "Đã liên hệ khách" });
    },
  });
  const service = createStaffPaymentsService(client);

  await service.exceptions({ page: 2, pageSize: 10 });
  await service.updateNote(8, "Đã liên hệ khách");
  await service.report({ from: "2026-10-01T00:00:00+07:00", to: "2026-10-03T23:59:59.999+07:00" });

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "GET", path: "/api/v1/staff/payments/exceptions" },
    { method: "PUT", path: "/api/v1/staff/payments/8/note" },
    { method: "GET", path: "/api/v1/staff/payments/report" },
  ]);
  assert.match(calls[0].query, /page=2/);
  assert.deepEqual(calls[1].body, { note: "Đã liên hệ khách" });
  assert.match(decodeURIComponent(calls[2].query), /from=2026-10-01T00:00:00\+07:00/);
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
