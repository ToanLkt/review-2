"use client";
import { Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { money, date } from "@/lib/formatters";
import { locationOf } from "@/lib/operations/selectors";
import { lifecycleOf } from "@/lib/operations/cycles";
import type { Order } from "@/lib/types";
import { useOrders } from "./orders-provider";
import { Section, OrderBadge, Note } from "./order-ui";
export function OrderItems({
  order,
  onTray,
}: {
  order: Order;
  onTray: (id: string) => void;
}) {
  const { state, operations } = useOrders();
  if (order.kind === "retail")
    return (
      <>
        <Section title="CHI TIẾT SẢN PHẨM">
          {order.products.map((p) => (
            <div
              key={p.name}
              className="flex justify-between gap-3 rounded-xl bg-[#F7FAF8] p-4"
            >
              <div>
                <h4 className="text-sm font-semibold">{p.name}</h4>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.quantity} gói × {money(p.price)}
                </p>
              </div>
              <strong className="text-sm whitespace-nowrap">
                {money(p.price * p.quantity)}
              </strong>
            </div>
          ))}
        </Section>
        <Section title="SỐ LƯỢNG & KHO">
          {state.allocations[order.id]?.map((line) => (
            <div key={line.name} className="rounded-xl border p-4">
              <h4 className="mb-3 text-xs font-semibold">{line.name}</h4>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Số lượng đặt", line.quantity],
                  ["Số lượng đã giữ", line.reserved],
                  [
                    "Tồn kho",
                    state.stock.find((s) => s.name === line.name)?.onHand ??
                      "—",
                  ],
                  ["Số lượng đã xuất", line.dispatched],
                ].map(([l, v]) => (
                  <div key={l}>
                    <dt className="text-muted-foreground">{l}</dt>
                    <dd className="mt-1 font-semibold">{v} gói</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <Note>
            Hạt giống chỉ được giữ sau khi thanh toán thành công và được xuất
            kho khi ghi nhận bàn giao. Đơn mua hạt giống không tạo khay hoặc chu
            kỳ trồng.
          </Note>
        </Section>
        <Section title="ĐÓNG GÓI & GIAO HÀNG">
          <OrderBadge>{state.records[order.id].processing}</OrderBadge>
          <p className="text-xs text-muted-foreground">
            {state.records[order.id].delivery}
          </p>
        </Section>
      </>
    );
  const items = operations.items.filter((i) => i.orderId === order.id),
    assigned = operations.assignments.filter((a) => a.orderId === order.id);
  return (
    <>
      <Section title="DÒNG THUÊ KHAY">
        <div className="flex flex-wrap items-center gap-2">
          <OrderBadge>Thuê khay</OrderBadge>
          <p className="text-xs text-muted-foreground">
            Khay yêu cầu: {items.reduce((s, i) => s + i.quantity, 0)} · Đã cấp
            phát: {assigned.length}
          </p>
        </div>
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-[#F7FAF8] p-4">
            <h4 className="text-sm font-semibold">{item.seed}</h4>
            <p className="mt-2 text-xs text-muted-foreground">
              Số khay: {item.quantity} · Đã cấp phát:{" "}
              {assigned.filter((a) => a.itemId === item.id).length}
            </p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Giá đã thỏa thuận theo đơn: {money(order.total)}. Không áp dụng lại
          bảng giá hiện tại.
        </p>
      </Section>
      <Section title="KHAY THỰC TẾ CẤP PHÁT">
        {assigned.map((a) => {
          const tray = operations.trays.find((t) => t.id === a.trayId),
            cycles = operations.cycles.filter((c) => c.assignmentId === a.id);
          return (
            tray && (
              <div key={a.id} className="flex gap-3 rounded-xl border p-3">
                <Layers className="mt-1 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <button
                    onClick={() => onTray(tray.id)}
                    className="rounded text-left text-xs font-semibold text-primary hover:underline"
                  >
                    {tray.code} · {locationOf(operations, tray).label}
                  </button>
                  {cycles.length ? (
                    cycles.map((c) => (
                      <p
                        key={c.id}
                        className="mt-2 text-[11px] leading-5 text-muted-foreground"
                      >
                        Chu kỳ:{" "}
                        <Link
                          href={"/admin/trays?tab=cycles&cycle=" + c.id}
                          className="text-primary hover:underline"
                        >
                          {c.id}
                        </Link>{" "}
                        ·{" "}
                        {c.harvestRecord
                          ? "Thu hoạch " +
                            date(c.harvestRecord.at) +
                            " (" +
                            c.harvestRecord.weight.toLocaleString("vi-VN") +
                            " kg)"
                          : "Dự kiến " + date(c.harvest)}{" "}
                        · {lifecycleOf(c)}
                      </p>
                    ))
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Chưa tạo chu kỳ
                    </p>
                  )}
                </div>
              </div>
            )
          );
        })}
        {!assigned.length && (
          <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Chưa cấp phát khay cho đơn này.
          </p>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/trays?tab=trays">Quản lý cấp phát khay</Link>
        </Button>
      </Section>
      {order.batches.length > 0 && (
        <Section title="CÁC ĐỢT GIAO">
          <p className="text-xs text-muted-foreground">
            Các đợt thuộc cùng đơn đã thanh toán, không thu tiền lại.
          </p>
          {order.batches.map((b) => (
            <div key={b.id} className="rounded-xl bg-[#F7FAF8] p-3 text-xs">
              <strong>{b.id}</strong>
              <p className="mt-2 text-muted-foreground">
                {b.trayIds.join(", ")}
              </p>
              <p className="mt-2">Dự kiến: {date(b.date)}</p>
            </div>
          ))}
        </Section>
      )}
    </>
  );
}
export function RelatedTray({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { operations } = useOrders(),
    tray = operations.trays.find((t) => t.id === id);
  if (!tray) return <p>Không tìm thấy khay.</p>;
  const assignment = operations.assignments.find(
      (a) => a.trayId === id && a.active,
    ),
    cycle = operations.cycles.find((c) => c.trayId === id && c.active);
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft />
        Quay lại đơn hàng
      </Button>
      <Section title="THÔNG TIN KHAY">
        <h3 className="text-xl font-semibold">{tray.code}</h3>
        <OrderBadge>{tray.status}</OrderBadge>
        <p className="text-sm">{locationOf(operations, tray).label}</p>
        <p className="text-sm text-muted-foreground">{tray.specification}</p>
        <p className="text-sm">Đơn thuê: {assignment?.orderId ?? "—"}</p>
        <p className="text-sm">Chu kỳ hiện tại: {cycle?.id ?? "—"}</p>
        {cycle && (
          <Button asChild variant="outline">
            <Link href={"/admin/trays?tab=cycles&cycle=" + cycle.id}>
              Xem chu kỳ trồng
            </Link>
          </Button>
        )}
      </Section>
      <Section title="LỊCH SỬ KHAY">
        {tray.history.map((e) => (
          <div key={e.id} className="border-l-2 border-primary/30 pl-3 text-sm">
            <p>{e.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {date(e.at)} · {e.staff}
            </p>
          </div>
        ))}
      </Section>
    </div>
  );
}
