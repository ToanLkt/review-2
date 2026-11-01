export type VietQrPaymentData = {
  bankBin: string | null | undefined;
  bankAccountNumber: string | null | undefined;
  accountName: string | null | undefined;
  amount: number;
  paymentCode: string | null | undefined;
};

export function buildVietQrImageUrl(payment: VietQrPaymentData): string | null {
  const bankBin = payment.bankBin?.trim() ?? "";
  const accountNumber = payment.bankAccountNumber?.trim() ?? "";
  const paymentCode = payment.paymentCode?.trim() ?? "";
  const amount = payment.amount;

  if (!/^\d{6}$/.test(bankBin)
    || !/^[A-Za-z0-9]{6,19}$/.test(accountNumber)
    || !Number.isSafeInteger(amount)
    || amount <= 0
    || amount.toString().length > 13
    || !/^[A-Za-z0-9 ]{1,50}$/.test(paymentCode)) {
    return null;
  }

  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: paymentCode,
  });
  const accountName = payment.accountName?.trim();
  if (accountName) query.set("accountName", accountName);

  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.svg?${query.toString()}`;
}
