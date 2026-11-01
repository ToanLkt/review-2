import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import type { ApiResponse } from "./types";
import { parseBackendDate } from "@/lib/user-format";

import type { PagedResult } from "./seed-service";

export const paymentStatuses = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const paymentExceptionTypes = [
  "NONE",
  "UNDERPAID",
  "OVERPAID",
  "LATE",
  "REFERENCE_MISMATCH",
  "ORDER_STATE_MISMATCH",
  "UNMATCHED",
] as const;
export type PaymentExceptionType = (typeof paymentExceptionTypes)[number];

export function normalizePaymentStatus(value: string | null | undefined): PaymentStatus | null {
  const normalized = value?.trim().toUpperCase();
  return paymentStatuses.find((status) => status === normalized) ?? null;
}

export function isPaymentSuccess(status: string | null | undefined) {
  return normalizePaymentStatus(status) === "SUCCESS";
}

export function isPaymentTerminal(status: string | null | undefined) {
  const normalized = normalizePaymentStatus(status);
  return normalized === "SUCCESS" || normalized === "FAILED" || normalized === "EXPIRED";
}

export function normalizePaymentException(value: string | null | undefined): PaymentExceptionType | null {
  const normalized = value?.trim().toUpperCase();
  return paymentExceptionTypes.find((type) => type === normalized) ?? null;
}

export function hasPaymentException(value: string | null | undefined) {
  const normalized = normalizePaymentException(value);
  return normalized !== null && normalized !== "NONE";
}

export function canRetryPayment(
  status: string | null | undefined,
  exceptionType: string | null | undefined,
  orderStatus: string | null | undefined,
  expiresAt: string | null | undefined,
  now = Date.now(),
) {
  const expiresAtMs = parseBackendDate(expiresAt)?.getTime() ?? Number.NaN;
  return normalizePaymentStatus(status) === "FAILED"
    && normalizePaymentException(exceptionType) === "UNDERPAID"
    && orderStatus?.trim().toUpperCase() === "AWAITING_PAYMENT"
    && Number.isFinite(expiresAtMs)
    && expiresAtMs > now;
}

export function isOrderPaymentExpired(
  orderStatus: string | null | undefined,
  expiresAt: string | null | undefined,
  now = Date.now(),
) {
  if (orderStatus?.trim().toUpperCase() === "EXPIRED") return true;
  const expiresAtMs = parseBackendDate(expiresAt)?.getTime() ?? Number.NaN;
  return Number.isFinite(expiresAtMs) && expiresAtMs <= now;
}

export function paymentExceptionLabel(value: string | null | undefined) {
  const normalized = normalizePaymentException(value);
  if (normalized === "UNDERPAID") return "Số tiền chuyển chưa đủ";
  if (normalized === "OVERPAID") return "Số tiền chuyển nhiều hơn số tiền cần thanh toán";
  if (normalized === "LATE") return "Giao dịch được ghi nhận sau khi đơn đã hết hạn";
  if (normalized === "REFERENCE_MISMATCH") return "Nội dung chuyển khoản không khớp";
  if (normalized === "ORDER_STATE_MISMATCH") return "Trạng thái đơn hàng không còn phù hợp";
  if (normalized === "UNMATCHED") return "Chưa xác định được đơn hàng của giao dịch";
  return hasPaymentException(value) ? "Giao dịch cần được kiểm tra" : null;
}

export type PaymentInstructions = {
  paymentId: number;
  orderId: number;
  status: PaymentStatus;
  amount: number;
  paymentCode: string;
  bankName: string;
  bankBin: string;
  bankAccountNumber: string;
  accountName: string;
  qrCodeUrl: string | null;
  expiresAt: string;
};

export type PaymentStatusResponse = {
  paymentId: number;
  orderId: number;
  status: PaymentStatus;
  expectedAmount: number;
  amountPaid: number;
  exceptionType: PaymentExceptionType;
  paidAt: string | null;
  staffNote: string | null;
};

export type PaymentHistoryItem = {
  paymentId: number;
  orderId: number;
  orderCode: string;
  paymentStatus: PaymentStatus;
  expectedAmount: number;
  amountPaid: number;
  exceptionType: PaymentExceptionType;
  paidAt: string | null;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function isPaymentInstructions(value: unknown): value is PaymentInstructions {
  if (!value || typeof value !== "object") return false;
  const payment = value as Record<string, unknown>;
  return Number.isInteger(payment.paymentId)
    && Number.isInteger(payment.orderId)
    && typeof payment.amount === "number"
    && Number.isFinite(payment.amount)
    && payment.amount >= 0
    && typeof payment.paymentCode === "string"
    && typeof payment.bankName === "string"
    && typeof payment.bankBin === "string"
    && typeof payment.bankAccountNumber === "string"
    && typeof payment.accountName === "string"
    && (typeof payment.qrCodeUrl === "string" || payment.qrCodeUrl === null)
    && typeof payment.expiresAt === "string"
    && Number.isFinite(new Date(payment.expiresAt).getTime())
    && payment.status === normalizePaymentStatus(String(payment.status));
}

function isPaymentStatusResponse(value: unknown): value is PaymentStatusResponse {
  if (!value || typeof value !== "object") return false;
  const payment = value as Record<string, unknown>;
  return Number.isInteger(payment.paymentId)
    && Number.isInteger(payment.orderId)
    && typeof payment.expectedAmount === "number"
    && Number.isFinite(payment.expectedAmount)
    && typeof payment.amountPaid === "number"
    && Number.isFinite(payment.amountPaid)
    && payment.status === normalizePaymentStatus(String(payment.status))
    && payment.exceptionType === normalizePaymentException(String(payment.exceptionType))
    && (typeof payment.paidAt === "string" || payment.paidAt === null)
    && (typeof payment.staffNote === "string" || payment.staffNote === null);
}

function validate<T>(value: unknown, guard: (candidate: unknown) => candidate is T, fallback: string): T {
  if (!guard(value)) throw new ApiError(fallback, 200, null, value);
  return value;
}

export function createPaymentService(client: ApiClient = apiClient) {
  const createRequests = new Map<number, Promise<PaymentInstructions>>();

  return {
    async createPayment(orderId: number) {
      const inFlight = createRequests.get(orderId);
      if (inFlight) return inFlight;

      const request = (async () => {
        const response = await client.post<unknown>(`/payments/orders/${orderId}`);
        return validate(unwrap(response, "Không thể tạo thanh toán."), isPaymentInstructions, "Dữ liệu hướng dẫn thanh toán không hợp lệ.");
      })();
      createRequests.set(orderId, request);
      try {
        return await request;
      } finally {
        if (createRequests.get(orderId) === request) createRequests.delete(orderId);
      }
    },

    async getPaymentStatus(orderId: number) {
      const response = await client.get<unknown>(`/payments/orders/${orderId}`);
      return validate(unwrap(response, "Không thể tải trạng thái thanh toán."), isPaymentStatusResponse, "Dữ liệu trạng thái thanh toán không hợp lệ.");
    },

    async getPaymentHistory(page = 1, pageSize = 10) {
      const response = await client.get<PagedResult<PaymentHistoryItem>>("/payments", {
        query: { Page: page, PageSize: pageSize },
      });
      return unwrap(response, "Không thể tải lịch sử thanh toán.");
    },
  };
}

export const paymentService = createPaymentService();
