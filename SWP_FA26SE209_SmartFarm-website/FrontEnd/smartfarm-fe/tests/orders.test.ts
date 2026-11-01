import test from "node:test";
import assert from "node:assert/strict";
import { initialOrders } from "../lib/mock-data";
import { initialOperations } from "../lib/operations/mock-data";
import {
  initialOrderState,
  transitionOrder,
  availableActions,
  dateMatches,
} from "../lib/orders";
const initial = () => initialOrderState(initialOrders, initialOperations);
test("Đơn dùng mã chung, tách thanh toán và xử lý, giữ tiền lịch sử", () => {
  const state = initial();
  assert.equal(Object.keys(state.records).length, initialOrders.length);
  assert.equal(state.records["DH-101"].processing, "Đang trồng");
  assert.equal(state.records["DH-108"].processing, "Chuẩn bị & đóng gói hạt");
  assert.equal(state.allocations["DH-109"][0].reserved, 0);
  assert.equal(
    state.allocations["DH-108"][0].reserved,
    state.allocations["DH-108"][0].quantity,
  );
  assert.equal(state.allocations["DH-101"], undefined);
});
test("Không hoàn tất theo ngày; chặn chưa thanh toán, nhảy bước và hủy cây đang trồng", () => {
  const state = initial();
  for (const action of ["accept", "handover", "complete"] as const)
    assert.throws(() =>
      transitionOrder(
        state,
        initialOrders,
        initialOperations,
        "DH-109",
        action,
        "2026-09-30",
      ),
    );
  assert.throws(() =>
    transitionOrder(
      state,
      initialOrders,
      initialOperations,
      "DH-101",
      "cancel",
      "2026-09-30",
    ),
  );
  assert.throws(() =>
    transitionOrder(
      state,
      initialOrders,
      initialOperations,
      "DH-108",
      "complete",
      "2026-09-30",
    ),
  );
  assert.equal(state.records["DH-108"].processing, "Chuẩn bị & đóng gói hạt");
});
test("Bàn giao xuất kho đúng một lần, nhận hàng và hoàn tất là hai xác nhận riêng", () => {
  let state = initial();
  const old = structuredClone(state),
    money = initialOrders.find((o) => o.id === "DH-108")!.total;
  state = transitionOrder(
    state,
    initialOrders,
    initialOperations,
    "DH-108",
    "handover",
    "2026-09-15",
  );
  const line = state.allocations["DH-108"][0];
  assert.equal(line.reserved, 0);
  assert.equal(line.dispatched, line.quantity);
  assert.equal(state.stock[0].onHand, old.stock[0].onHand - line.quantity);
  assert.throws(() =>
    transitionOrder(
      state,
      initialOrders,
      initialOperations,
      "DH-108",
      "handover",
      "2026-09-15",
    ),
  );
  state = transitionOrder(
    state,
    initialOrders,
    initialOperations,
    "DH-108",
    "receive",
    "2026-09-16",
  );
  assert.equal(state.records["DH-108"].delivery, "Đã giao");
  assert.notEqual(state.records["DH-108"].processing, "Hoàn tất");
  state = transitionOrder(
    state,
    initialOrders,
    initialOperations,
    "DH-108",
    "complete",
    "2026-09-16",
  );
  assert.equal(state.records["DH-108"].processing, "Hoàn tất");
  assert.equal(initialOrders.find((o) => o.id === "DH-108")!.total, money);
  assert.deepEqual(
    availableActions(
      initialOrders[7],
      state.records["DH-108"],
      initialOperations,
    ),
    [],
  );
});
test("Hủy trả lượng giữ nhưng không hoàn tiền, không xuất kho hoặc mất lịch sử", () => {
  const before = initial(),
    after = transitionOrder(
      before,
      initialOrders,
      initialOperations,
      "DH-108",
      "cancel",
      "2026-09-15",
    );
  assert.equal(after.allocations["DH-108"][0].reserved, 0);
  assert.equal(
    after.allocations["DH-108"][0].quantity,
    before.allocations["DH-108"][0].quantity,
  );
  assert.deepEqual(after.stock, before.stock);
  assert.equal(initialOrders[7].payment, "Đã xác nhận");
  assert.equal(after.records["DH-108"].events.length, 1);
});
test("Thiếu tồn kho không được bàn giao và không cập nhật dở dang", () => {
  const state = initial();
  state.stock[0].onHand = 0;
  const before = structuredClone(state);
  assert.throws(() =>
    transitionOrder(
      state,
      initialOrders,
      initialOperations,
      "DH-108",
      "handover",
      "2026-09-15",
    ),
  );
  assert.deepEqual(state, before);
});
test("Lọc ngày có biên bao gồm, ngày cố định và khoảng không hợp lệ", () => {
  assert.equal(dateMatches("2026-09-15T08:00:00+07:00", "today", "", ""), true);
  assert.equal(dateMatches("2026-09-09", "7", "", ""), true);
  assert.equal(dateMatches("2026-09-08", "7", "", ""), false);
  assert.equal(
    dateMatches("2026-09-10", "custom", "2026-09-10", "2026-09-10"),
    true,
  );
  assert.equal(
    dateMatches("2026-09-10", "custom", "2026-09-12", "2026-09-10"),
    false,
  );
  assert.equal(dateMatches("2026-09-10", "custom", "", ""), false);
});
