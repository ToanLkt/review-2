import type { ApiClient } from "../client";

export type PaymentExceptionType =
  | "UNDERPAID"
  | "OVERPAID"
  | "LATE"
  | "REFERENCE_MISMATCH"
  | "ORDER_STATE_MISMATCH"
  | "UNMATCHED"
  | string;

export type PaymentException = {
  eventId: number;
  sePayTransactionId: number;
  orderId: number | null;
  paymentId: number | null;
  paymentCode: string | null;
  referenceCode: string;
  amount: number;
  exceptionType: PaymentExceptionType;
  transactionAt: string;
  staffNote: string | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
};

export type PagedPaymentExceptions = {
  items: PaymentException[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PaymentReport = {
  totalTransactions: number;
  totalReceived: number;
  successful: number;
  exceptions: number;
  exceptionsByType: Record<string, number>;
};

export type PaymentExceptionQuery = {
  page?: number;
  pageSize?: number;
};

export type PaymentReportQuery = {
  from?: string;
  to?: string;
};

export function createStaffPaymentsService(client: ApiClient) {
  return {
    async exceptions(query: PaymentExceptionQuery = {}) {
      const response = await client.get<PagedPaymentExceptions>(
        "/staff/payments/exceptions",
        { query },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async updateNote(eventId: number, note: string) {
      const response = await client.put<PaymentException, { note: string }>(
        `/staff/payments/${eventId}/note`,
        { note },
      );
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },

    async report(query: PaymentReportQuery = {}) {
      const response = await client.get<PaymentReport>("/staff/payments/report", {
        query,
      });
      if (!response.data) throw new Error("Dữ liệu chưa sẵn sàng. Vui lòng thử lại.");
      return response.data;
    },
  };
}
