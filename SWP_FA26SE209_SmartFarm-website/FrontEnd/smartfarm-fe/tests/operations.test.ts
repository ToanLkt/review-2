import { test } from "node:test";
import assert from "node:assert/strict";
import { initialOperations as initial } from "../lib/operations/mock-data";
import { initialOrders, NOW } from "../lib/mock-data";
import { transition, type Operation } from "../lib/operations/transitions";
import {
  allPositions,
  areaStats,
  vacantPositions,
  currentAssignment,
  currentCycle,
  remaining,
} from "../lib/operations/selectors";
const run = (s: typeof initial, a: Operation) =>
  transition(s, a, initialOrders, NOW);
test("Khu vực, vị trí, khay và chu kỳ dùng cùng tổng số", () => {
  assert.equal(initial.trays.length, 40);
  assert.equal(
    initial.trays.filter((t) => t.status === "Đang trồng").length,
    32,
  );
  assert.equal(allPositions(initial).length, 48);
  assert.equal(
    initial.areas.reduce((n, a) => n + areaStats(initial, a).installed, 0),
    38,
  );
  assert.equal(
    new Set(initial.trays.flatMap((t) => (t.positionId ? [t.positionId] : [])))
      .size,
    38,
  );
  for (const t of initial.trays) {
    const assignment = currentAssignment(initial, t.id),
      cycle = currentCycle(initial, t.id);
    if (t.status === "Sẵn sàng") {
      assert.equal(assignment, undefined);
      assert.equal(cycle, undefined);
    }
    if (t.status === "Đang trồng") {
      assert.ok(cycle);
      assert.ok(assignment);
      assert.equal(cycle.assignmentId, assignment.id);
    }
    if (assignment)
      assert.equal(
        initialOrders.find((o) => o.id === assignment.orderId)?.kind,
        "rental",
      );
  }
});
test("Di chuyển giải phóng vị trí nguồn và giữ duy nhất một khay tại đích", () => {
  const destination = vacantPositions(initial)[0].id;
  const s = run(initial, {
    type: "tray-move",
    id: "KH-A15",
    positionId: destination,
  });
  assert.equal(s.trays.find((t) => t.id === "KH-A15")?.positionId, destination);
  assert.equal(areaStats(s, s.areas[0]).installed, 15);
  assert.equal(areaStats(s, s.areas[2]).installed, 11);
  assert.equal(
    initial.trays.find((t) => t.id === "KH-A15")?.positionId === destination,
    false,
  );
  assert.throws(
    () => run(s, { type: "tray-move", id: "KH-A16", positionId: destination }),
    /đã có khay/,
  );
  assert.throws(
    () =>
      run(s, {
        type: "tray-move",
        id: "KH-A01",
        positionId: vacantPositions(s)[0].id,
      }),
    /Chỉ di chuyển/,
  );
});
test("Phân bổ chỉ giữ chỗ, chặn trùng và vượt số lượng", () => {
  const item = initial.items[0];
  assert.equal(remaining(initial, item.id), 1);
  const s = run(initial, { type: "allocate", id: "KH-A15", itemId: item.id });
  assert.equal(s.trays.find((t) => t.id === "KH-A15")?.status, "Đã giữ chỗ");
  assert.equal(currentCycle(s, "KH-A15"), undefined);
  assert.equal(remaining(s, item.id), 0);
  assert.throws(
    () => run(s, { type: "allocate", id: "KH-A15", itemId: item.id }),
    /không còn sẵn sàng/,
  );
  assert.throws(
    () => run(s, { type: "allocate", id: "KH-A16", itemId: item.id }),
    /đủ khay/,
  );
});
test("Không phân bổ đơn bán hạt, chưa thanh toán, hoàn tất hoặc hủy", () => {
  const item = initial.items[0];
  for (const patch of [
    { kind: "retail" },
    { payment: "Chờ thanh toán" },
    { status: "Hoàn tất" },
    { status: "Đã hủy" },
  ]) {
    const orders = initialOrders.map((o) =>
      o.id === item.orderId ? { ...o, ...patch } : o,
    ) as typeof initialOrders;
    assert.throws(
      () =>
        transition(
          initial,
          { type: "allocate", id: "KH-A15", itemId: item.id },
          orders,
          NOW,
        ),
      /Chỉ phân bổ/,
    );
  }
  assert.throws(
    () => run(initial, { type: "allocate", id: "KH-C11", itemId: item.id }),
    /bố trí khay/,
  );
});
test("Tạo khay kiểm tra mã, vị trí và không gắn khách hàng", () => {
  const draft = {
    code: "KH-Z01",
    specification: "Khay nhựa 60 × 40 cm",
    positionId: vacantPositions(initial)[0].id,
    notes: "",
  };
  const s = run(initial, { type: "tray-save", draft });
  const t = s.trays.at(-1)!;
  assert.equal(t.status, "Sẵn sàng");
  assert.equal(currentAssignment(s, t.id), undefined);
  assert.throws(
    () => run(initial, { type: "tray-save", draft: { ...draft, positionId: null } }),
    /Vui lòng chọn khu vực, kệ, tầng và vị trí/,
  );
  assert.throws(
    () => run(s, { type: "tray-save", draft }),
    /Mã khay đã tồn tại/,
  );
  assert.throws(
    () =>
      run(s, {
        type: "tray-save",
        draft: { ...draft, code: "KH-Z02", positionId: "bad" },
      }),
    /không thuộc/,
  );
  assert.throws(
    () =>
      run(s, {
        type: "tray-save",
        draft: {
          ...draft,
          code: "KH-Z02",
          positionId: initial.trays[0].positionId,
        },
      }),
    /đã có khay/,
  );
});
test("Không giảm cấu hình làm mất chỗ; không bảo trì khu có cây đang trồng", () => {
  const area = structuredClone(initial.areas[0]);
  assert.throws(
    () =>
      run(initial, {
        type: "area-save",
        id: area.id,
        draft: { ...area, shelves: [{ ...area.shelves[0], levels: 1 }] },
      }),
    /KH-A/,
  );
  assert.throws(
    () => run(initial, { type: "area-save", draft: area }),
    /Tên khu vực đã tồn tại/,
  );
  assert.throws(
    () =>
      run(initial, {
        type: "area-save",
        id: area.id,
        draft: { ...area, shelves: [{ ...area.shelves[0], levels: 0 }] },
      }),
    /1–10 tầng/,
  );
  assert.throws(
    () => run(initial, { type: "area-maintenance", id: "A" }),
    /KH-A01/,
  );
});
test("Vệ sinh và bảo trì lưu lịch sử, giữ nguyên hồ sơ thuê và chu kỳ", () => {
  for (const id of ["KH-B12", "KH-C09"]) {
    const s = run(initial, { type: "tray-status", id, status: "Sẵn sàng" });
    const t = s.trays.find((t) => t.id === id)!;
    assert.equal(t.status, "Sẵn sàng");
    assert.equal(
      t.history.length,
      initial.trays.find((t) => t.id === id)!.history.length + 1,
    );
    assert.deepEqual(s.assignments, initial.assignments);
    assert.deepEqual(s.cycles, initial.cycles);
  }
  assert.throws(
    () =>
      run(initial, { type: "tray-status", id: "KH-A01", status: "Bảo trì" }),
    /Không thể thay đổi/,
  );
});
