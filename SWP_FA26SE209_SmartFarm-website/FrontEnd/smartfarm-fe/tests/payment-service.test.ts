import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, createApiClient } from "@/lib/api/client";
import { canRetryPayment, createPaymentService, hasPaymentException, isOrderPaymentExpired, isPaymentTerminal, paymentExceptionLabel } from "@/lib/api/payment-service";

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, message: null, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("payment service creates instructions and gets status with auth", async () => {
  const calls: { url: URL; method: string; authorization: string }[] = [];
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
      calls.push({ url, method: init?.method ?? "GET", authorization: new Headers(init?.headers).get("Authorization") ?? "" });
      if (init?.method === "POST") return jsonResponse({ paymentId: 9, orderId: 25, status: "PENDING", amount: 90000, paymentCode: "PAY25", bankName: "Test Bank", bankBin: "970423", bankAccountNumber: "123", accountName: "SMARTFARM", qrCodeUrl: "https://img.vietqr.io/example.svg", expiresAt: "2026-10-02T12:00:00Z" });
      if (url.pathname.endsWith("/payments")) return jsonResponse({ items: [{ paymentId: 9, orderId: 25, orderCode: "ORD-25", paymentStatus: "EXPIRED", expectedAmount: 90000, amountPaid: 0, exceptionType: "LATE", paidAt: null }], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 });
      return jsonResponse({ paymentId: 9, orderId: 25, status: "SUCCESS", expectedAmount: 90000, amountPaid: 90000, exceptionType: "NONE", paidAt: "2026-10-02T11:00:00Z", staffNote: null });
    },
  });
  const service = createPaymentService(client);

  const instructions = await service.createPayment(25);
  const status = await service.getPaymentStatus(25);
  const history = await service.getPaymentHistory(2, 10);

  assert.equal(instructions.paymentCode, "PAY25");
  assert.equal(instructions.bankBin, "970423");
  assert.equal(instructions.qrCodeUrl, "https://img.vietqr.io/example.svg");
  assert.equal(status.status, "SUCCESS");
  assert.equal(isPaymentTerminal("PENDING"), false);
  assert.equal(isPaymentTerminal("SUCCESS"), true);
  assert.equal(isPaymentTerminal("FAILED"), true);
  assert.equal(isPaymentTerminal("EXPIRED"), true);
  assert.equal(hasPaymentException("NONE"), false);
  assert.equal(hasPaymentException("UNDERPAID"), true);
  assert.equal(paymentExceptionLabel("UNDERPAID"), "Số tiền chuyển chưa đủ");
  assert.equal(history.items[0].paymentStatus, "EXPIRED");
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
    ["POST", "/api/v1/payments/orders/25"],
    ["GET", "/api/v1/payments/orders/25"],
    ["GET", "/api/v1/payments"],
  ]);
  assert.equal(calls[2].url.searchParams.get("Page"), "2");
  assert.equal(calls[2].url.searchParams.get("PageSize"), "10");
  assert.ok(calls.every((call) => call.authorization === "Bearer access-token"));
});

test("payment retry is limited to an underpaid failed payment on an active awaiting order", () => {
  const now = Date.parse("2026-10-24T09:00:00Z");
  const activeExpiry = "2026-10-24T09:30:00Z";

  assert.equal(canRetryPayment("FAILED", "UNDERPAID", "AWAITING_PAYMENT", activeExpiry, now), true);
  assert.equal(canRetryPayment("FAILED", "LATE", "AWAITING_PAYMENT", activeExpiry, now), false);
  assert.equal(canRetryPayment("FAILED", "UNDERPAID", "CONFIRMED", activeExpiry, now), false);
  assert.equal(canRetryPayment("FAILED", "UNDERPAID", "AWAITING_PAYMENT", "2026-10-24T08:59:59Z", now), false);
  assert.equal(canRetryPayment("SUCCESS", "OVERPAID", "CONFIRMED", activeExpiry, now), false);
});

test("payment deadline without timezone is interpreted as Backend UTC", () => {
  const backendDeadline = "2026-10-24T02:32:45.839368";

  assert.equal(isOrderPaymentExpired("AWAITING_PAYMENT", backendDeadline, Date.parse("2026-10-24T02:10:00Z")), false);
  assert.equal(isOrderPaymentExpired("AWAITING_PAYMENT", backendDeadline, Date.parse("2026-10-24T02:33:00Z")), true);
  assert.equal(isOrderPaymentExpired("EXPIRED", "2026-10-25T02:32:45", Date.parse("2026-10-24T02:10:00Z")), true);
  assert.equal(canRetryPayment("FAILED", "UNDERPAID", "AWAITING_PAYMENT", backendDeadline, Date.parse("2026-10-24T02:10:00Z")), true);
});

test("concurrent create payment calls share one POST request", async () => {
  let postCount = 0;
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
    fetcher: async () => {
      postCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return jsonResponse({ paymentId: 10, orderId: 26, status: "PENDING", amount: 120000, paymentCode: "TR26", bankName: "Test Bank", bankBin: "970423", bankAccountNumber: "123456", accountName: "SMARTFARM", qrCodeUrl: null, expiresAt: "2026-10-24T09:30:00Z" });
    },
  });
  const service = createPaymentService(client);

  const [first, second] = await Promise.all([
    service.createPayment(26),
    service.createPayment(26),
  ]);

  assert.equal(postCount, 1);
  assert.equal(first.paymentId, second.paymentId);
});

test("payment instructions reject the obsolete qrUrl contract", async () => {
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
    fetcher: async () => jsonResponse({ paymentId: 11, orderId: 27, status: "PENDING", amount: 120000, paymentCode: "TR27", bankName: "Test Bank", bankBin: "970423", bankAccountNumber: "123456", accountName: "SMARTFARM", qrUrl: "https://img.vietqr.io/legacy.png", expiresAt: "2026-10-24T09:30:00Z" }),
  });

  await assert.rejects(() => createPaymentService(client).createPayment(27), ApiError);
});
