export type PaymentMethod = "bank" | "ewallet" | "cod";

export const paymentMethods: { id: PaymentMethod; label: string; description: string }[] = [
  { id: "bank", label: "SePay QR (demo)", description: "Quét mã mô phỏng và chọn kết quả giao dịch trên màn tiếp theo" },
];
