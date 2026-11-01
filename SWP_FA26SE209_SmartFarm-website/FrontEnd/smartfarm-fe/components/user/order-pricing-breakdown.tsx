import { formatVnd } from "@/lib/user-format";

type PricingBreakdownProps = {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
};

export function OrderPricingBreakdown(props: PricingBreakdownProps) {
  const pricingIncomplete = props.subtotal <= 0 || Math.abs(props.subtotal - props.discountAmount - props.totalAmount) >= 1;
  return <section className="mt-6 rounded-2xl border border-[#e8f3eb] bg-white p-6"><h2 className="text-xl font-bold">Chi tiết thanh toán</h2><dl className="mt-5 ml-auto max-w-md space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#6b7280]">Tạm tính</dt><dd className="font-semibold tabular-nums">{pricingIncomplete && props.subtotal <= 0 ? "Không còn dữ liệu" : formatVnd(props.subtotal)}</dd></div>{props.discountAmount > 0 && <div className="flex justify-between gap-4 text-[#3F7655]"><dt>Giảm giá ({props.discountPercent.toLocaleString("vi-VN")}%)</dt><dd className="font-semibold tabular-nums">−{formatVnd(props.discountAmount)}</dd></div>}<div className="flex justify-between gap-4 border-t border-[#e8f3eb] pt-3 text-base"><dt className="font-bold">Tổng thanh toán</dt><dd className="font-bold tabular-nums text-[#4F8F68]">{formatVnd(props.totalAmount)}</dd></div></dl>{pricingIncomplete && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Chi tiết giá của đơn hàng cũ không còn đầy đủ. Tổng thanh toán vẫn là số tiền chính thức của đơn.</p>}<p className="mt-4 text-xs leading-5 text-[#6b7280]">Tổng thanh toán do SmartFarm xác nhận tại thời điểm tạo đơn.</p></section>;
}
