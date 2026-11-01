import type { Order } from "./types";
import type { OperationsState } from "./operations/types";
import { lifecycleOf } from "./operations/cycles";
export const rentalSteps = [
  "Chờ xử lý",
  "Cấp phát khay",
  "Đang trồng",
  "Sẵn sàng thu hoạch",
  "Đóng gói",
  "Đang giao hàng",
  "Hoàn tất",
] as const;
export const seedSteps = [
  "Chờ xử lý",
  "Đã xác nhận",
  "Chuẩn bị & đóng gói hạt",
  "Đang giao hàng",
  "Hoàn tất",
] as const;
export type Processing =
  (typeof rentalSteps)[number] | (typeof seedSteps)[number] | "Đã hủy";
export type Delivery =
  | "Chưa giao"
  | "Đã bàn giao vận chuyển"
  | "Đang giao hàng"
  | "Đã giao"
  | "Hoàn tất";
export type OrderRecord = {
  id: string;
  processing: Processing;
  delivery: Delivery;
  phone: string;
  address: string;
  appointment: string;
  shippingFee: number;
  reference: string;
  paidAt: string | null;
  events: { text: string; at: string }[];
};
export type StockRecord = { name: string; onHand: number };
export type StockLine = {
  name: string;
  quantity: number;
  reserved: number;
  dispatched: number;
};
export type OrderState = {
  records: Record<string, OrderRecord>;
  stock: StockRecord[];
  allocations: Record<string, StockLine[]>;
};
export const referenceDay = "2026-09-15";
export function initialOrderState(
  orders: Order[],
  ops: OperationsState,
): OrderState {
  const records: OrderState["records"] = {},
    allocations: OrderState["allocations"] = {};
  const stock = new Map<string, number>();
  for (const [i, o] of orders.entries()) {
    const growing =
      o.kind === "rental" &&
      ops.assignments.some(
        (a) =>
          a.orderId === o.id &&
          ops.cycles.some((c) => c.assignmentId === a.id && c.active),
      );
    const processing: Processing =
      o.status === "Hoàn tất" || o.status === "Đã hủy"
        ? o.status
        : growing
          ? "Đang trồng"
          : o.kind === "retail" &&
              o.payment === "Đã xác nhận" &&
              o.id === "DH-108"
            ? "Chuẩn bị & đóng gói hạt"
            : o.status === "Đang xử lý"
              ? o.kind === "rental"
                ? "Cấp phát khay"
                : "Đã xác nhận"
              : "Chờ xử lý";
    records[o.id] = {
      id: o.id,
      processing,
      delivery: o.status === "Hoàn tất" ? "Hoàn tất" : "Chưa giao",
      phone: "090" + String(1112233 + i * 11111),
      address: "25 Nguyễn Huệ, Q.1, TP.HCM",
      appointment: o.kind === "rental" ? "2026-09-22" : "2026-09-16",
      shippingFee: 0,
      reference: "SEPAY-" + o.id.replace("-", "") + "-7F2A",
      paidAt: o.payment === "Đã xác nhận" ? o.created : null,
      events: [],
    };
    if (o.kind === "retail") {
      allocations[o.id] = o.products.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        reserved:
          o.payment === "Đã xác nhận" &&
          o.status !== "Hoàn tất" &&
          o.status !== "Đã hủy"
            ? p.quantity
            : 0,
        dispatched: o.status === "Hoàn tất" ? p.quantity : 0,
      }));
      for (const product of o.products) stock.set(product.name, 200);
    }
  }
  return {
    records,
    allocations,
    stock: [...stock].map(([name, onHand]) => ({ name, onHand })),
  };
}
export function orderCycles(ops: OperationsState, id: string) {
  const assigned = new Set(
    ops.assignments.filter((a) => a.orderId === id).map((a) => a.id),
  );
  return ops.cycles.filter((c) => assigned.has(c.assignmentId));
}
export function cancellationAllowed(
  o: Order,
  record: OrderRecord,
  ops: OperationsState,
) {
  return (
    record.delivery === "Chưa giao" &&
    !["Hoàn tất", "Đã hủy"].includes(record.processing) &&
    [
      "Chờ xử lý",
      "Đã xác nhận",
      "Cấp phát khay",
      "Chuẩn bị & đóng gói hạt",
    ].includes(record.processing) &&
    !orderCycles(ops, o.id).some((c) => c.active || !!c.harvestRecord)
  );
}
export type OrderAction =
  | "accept"
  | "grow"
  | "ready"
  | "pack"
  | "handover"
  | "transit"
  | "receive"
  | "complete"
  | "cancel";
export const actionLabels: Record<OrderAction, string> = {
  accept: "Tiếp nhận xử lý",
  grow: "Xác nhận bắt đầu trồng",
  ready: "Đánh dấu sẵn sàng thu hoạch",
  pack: "Xác nhận đóng gói",
  handover: "Ghi nhận bàn giao",
  transit: "Xác nhận đang giao hàng",
  receive: "Xác nhận khách đã nhận",
  complete: "Hoàn tất đơn hàng",
  cancel: "Hủy đơn",
};
export function availableActions(
  o: Order,
  r: OrderRecord,
  ops: OperationsState,
): OrderAction[] {
  if (["Hoàn tất", "Đã hủy"].includes(r.processing)) return [];
  const actions: OrderAction[] = [];
  if (o.payment === "Đã xác nhận") {
    const cycles = orderCycles(ops, o.id);
    const required = ops.items
      .filter((i) => i.orderId === o.id)
      .reduce((s, i) => s + i.quantity, 0);
    const allocated = ops.assignments.filter((a) => a.orderId === o.id).length;
    const fullyAllocated = required > 0 && allocated >= required;
    if (r.processing === "Chờ xử lý") actions.push("accept");
    if (
      r.processing === "Cấp phát khay" &&
      fullyAllocated &&
      cycles.filter((c) => c.active).length >= required
    )
      actions.push("grow");
    if (
      r.processing === "Đang trồng" &&
      fullyAllocated &&
      cycles.length >= required &&
      cycles.every((c) =>
        ["Sẵn sàng thu hoạch", "Đã thu hoạch"].includes(lifecycleOf(c)),
      )
    )
      actions.push("ready");
    if (
      r.processing === "Đã xác nhận" ||
      (r.processing === "Sẵn sàng thu hoạch" &&
        cycles.length >= required &&
        fullyAllocated &&
        cycles.every((c) => lifecycleOf(c) === "Đã thu hoạch"))
    )
      actions.push("pack");
    if (
      ["Đóng gói", "Chuẩn bị & đóng gói hạt"].includes(r.processing) &&
      r.delivery === "Chưa giao"
    )
      actions.push("handover");
    if (r.delivery === "Đã bàn giao vận chuyển")
      actions.push("transit", "receive");
    if (r.delivery === "Đang giao hàng") actions.push("receive");
    if (r.delivery === "Đã giao") actions.push("complete");
  }
  if (cancellationAllowed(o, r, ops)) actions.push("cancel");
  return actions;
}
export function transitionOrder(
  state: OrderState,
  orders: Order[],
  ops: OperationsState,
  id: string,
  action: OrderAction,
  at: string,
) {
  const order = orders.find((o) => o.id === id),
    record = state.records[id];
  if (
    !order ||
    !record ||
    !availableActions(order, record, ops).includes(action)
  )
    throw new Error(
      "Thao tác không còn phù hợp với thanh toán hoặc trạng thái hiện tại.",
    );
  const next = structuredClone(state),
    r = next.records[id];
  if (action === "accept")
    r.processing = order.kind === "rental" ? "Cấp phát khay" : "Đã xác nhận";
  if (action === "grow") r.processing = "Đang trồng";
  if (action === "ready") r.processing = "Sẵn sàng thu hoạch";
  if (action === "pack")
    r.processing =
      order.kind === "rental" ? "Đóng gói" : "Chuẩn bị & đóng gói hạt";
  if (action === "handover") {
    if (order.kind === "retail")
      for (const line of next.allocations[id] ?? []) {
        const stock = next.stock.find((s) => s.name === line.name);
        if (
          line.reserved !== line.quantity ||
          !stock ||
          stock.onHand < line.quantity
        )
          throw new Error(
            "Chưa giữ đủ hạt giống hoặc tồn kho không đủ để xuất.",
          );
        stock.onHand -= line.quantity;
        line.dispatched += line.reserved;
        line.reserved = 0;
      }
    r.processing = "Đang giao hàng";
    r.delivery = "Đã bàn giao vận chuyển";
  }
  if (action === "transit") r.delivery = "Đang giao hàng";
  if (action === "receive") r.delivery = "Đã giao";
  if (action === "complete") {
    r.processing = "Hoàn tất";
    r.delivery = "Hoàn tất";
  }
  if (action === "cancel") {
    r.processing = "Đã hủy";
    for (const line of next.allocations[id] ?? []) line.reserved = 0;
  }
  r.events.push({ text: actionLabels[action] + " · Nguyễn Minh", at });
  return next;
}
export function dateMatches(
  created: string,
  period: string,
  from: string,
  to: string,
) {
  const day = created.slice(0, 10);
  if (period === "custom")
    return !!from && !!to && from <= to && day >= from && day <= to;
  if (!period) return true;
  const days = period === "today" ? 1 : Number(period);
  const start = new Date(
    Date.parse(referenceDay + "T00:00:00Z") - (days - 1) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  return day >= start && day <= referenceDay;
}
