import { CreditCard } from "lucide-react";
import type { Order } from "@/lib/types";
import type { OrderRecord } from "@/lib/orders";
import { money, stamp, time } from "@/lib/formatters";
import { Section, Note, OrderBadge } from "./order-ui";
export function PaymentSection({
  order,
  record,
}: {
  order: Order;
  record: OrderRecord;
}) {
  const confirmed = order.payment === "Đã xác nhận";
  return (
    <Section title="THANH TOÁN (SEPAY)">
      <div className="space-y-3 rounded-xl bg-[#F7FAF8] p-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <CreditCard className="size-4 text-primary" />
          <OrderBadge>{order.payment}</OrderBadge>
        </div>
        <dl className="space-y-3">
          {[
            ["Mã tham chiếu", record.reference],
            ["Số tiền phải trả", money(order.total)],
            [
              "Số tiền xác nhận",
              confirmed ? money(order.total) : "Chưa có xác nhận",
            ],
            ["Thời gian", record.paidAt ? stamp(record.paidAt) : "—"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{l}</dt>
              <dd className="text-right font-medium break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      {confirmed && record.paidAt && (
        <div className="space-y-2" aria-label="Nhật ký thanh toán">
          {[
            {
              text: "Nhận thông báo chuyển khoản từ SePay",
              style: "bg-muted/50",
            },
            {
              text:
                "Ghi nhận thanh toán " +
                money(order.total) +
                " — đã đối chiếu mã tham chiếu",
              style: "bg-green-50 text-green-800",
            },
            {
              text: "Thông báo trùng — đã bỏ qua (webhook lặp cùng mã giao dịch)",
              style: "bg-amber-50 text-amber-800",
            },
          ].map((e) => (
            <div
              key={e.text}
              className={
                "flex gap-3 rounded-lg p-3 text-[11px] leading-5 " + e.style
              }
            >
              <span className="shrink-0 tabular-nums">
                {time(record.paidAt!)}
              </span>
              <p>{e.text}</p>
            </div>
          ))}
        </div>
      )}
      <Note warm>
        Xác nhận thanh toán do SePay đối soát tự động — Admin không cần đánh dấu
        đã thanh toán thủ công. Hoàn tiền không thực hiện trong ứng dụng đối với
        bất kỳ lý do nào.
      </Note>
    </Section>
  );
}
