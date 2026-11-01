import { test } from "node:test";
import assert from "node:assert/strict";
import { initialOperations } from "../lib/operations/mock-data";
import { initialOrders } from "../lib/mock-data";
import { initialVarieties } from "../lib/varieties";
import {
  changeCycle,
  expectedHarvest,
  lifecycleOf,
  type CycleOperation,
} from "../lib/operations/cycles";
import {
  currentCycle,
  currentAssignment,
  areaStats,
} from "../lib/operations/selectors";
import { transition } from "../lib/operations/transitions";
const at = "2026-09-15T16:00:00+07:00";
const draft = {
  varietyId: "var-1",
  trayId: "KH-A15",
  itemId: "",
  sowed: "2026-09-15",
  notes: "Theo dõi lứa mới",
};
const run = (state: typeof initialOperations, action: CycleOperation) =>
  changeCycle(state, action, initialOrders, initialVarieties, at);

test("Tạo chu kỳ cập nhật khay, số liệu khu vực và khóa trùng khay", () => {
  const state = run(initialOperations, { type: "cycle-save", draft });
  const cycle = currentCycle(state, draft.trayId)!;
  assert.equal(cycle.varietyId, "var-1");
  assert.equal(cycle.harvest, "2026-09-22");
  assert.equal(lifecycleOf(cycle), "Chuẩn bị");
  assert.equal(
    state.trays.find((t) => t.id === draft.trayId)!.status,
    "Đang trồng",
  );
  assert.equal(
    areaStats(state, state.areas[0]).growing,
    areaStats(initialOperations, initialOperations.areas[0]).growing + 1,
  );
  assert.throws(() => run(state, { type: "cycle-save", draft }), /sẵn sàng/);
  assert.equal(currentCycle(initialOperations, draft.trayId), undefined);
  assert.throws(
    () =>
      transition(
        state,
        { type: "tray-move", id: draft.trayId, positionId: "C/C-K2/2/3" },
        initialOrders,
        at,
      ),
    /Chỉ di chuyển/,
  );
});
test("Chặn giống bị tắt, vị trí chưa bố trí, ngày sai và dòng thuê không khớp", () => {
  assert.throws(
    () =>
      run(initialOperations, {
        type: "cycle-save",
        draft: { ...draft, varietyId: "var-4" },
      }),
    /tắt chọn/,
  );
  assert.throws(
    () =>
      run(initialOperations, {
        type: "cycle-save",
        draft: { ...draft, trayId: "KH-C11" },
      }),
    /bố trí/,
  );
  assert.throws(
    () =>
      run(initialOperations, {
        type: "cycle-save",
        draft: { ...draft, sowed: "2026-02-30" },
      }),
    /ngày gieo/,
  );
  assert.equal(expectedHarvest("2026-02-27", 7), "2026-03-06");
  assert.throws(
    () =>
      run(initialOperations, {
        type: "cycle-save",
        draft: { ...draft, itemId: initialOperations.items[0].id },
      }),
    /khớp/,
  );
  assert.throws(
    () =>
      run(initialOperations, {
        type: "cycle-save",
        draft: { ...draft, itemId: "DH-108" },
      }),
    /hợp lệ/,
  );
});
test("Chuyển giai đoạn theo thứ tự, thu hoạch có khối lượng và giữ lịch sử", () => {
  let state = run(initialOperations, { type: "cycle-save", draft });
  const id = currentCycle(state, draft.trayId)!.id;
  assert.throws(
    () =>
      run(state, {
        type: "cycle-stage",
        id,
        stage: "Sinh trưởng",
        day: "2026-09-15",
        notes: "",
      }),
    /kế tiếp/,
  );
  assert.throws(
    () =>
      run(state, {
        type: "cycle-harvest",
        id,
        day: "2026-09-15",
        notes: "",
        quality: "Tốt",
        weight: 1,
      }),
    /sẵn sàng/,
  );
  for (const stage of [
    "Đã gieo",
    "Nảy mầm",
    "Sinh trưởng",
    "Sẵn sàng thu hoạch",
  ] as const)
    state = run(state, {
      type: "cycle-stage",
      id,
      stage,
      day: "2026-09-15",
      notes: "Đã kiểm tra",
    });
  assert.throws(
    () =>
      run(state, {
        type: "cycle-harvest",
        id,
        day: "2026-09-15",
        notes: "",
        quality: "Tốt",
        weight: 0,
      }),
    /lớn hơn 0/,
  );
  state = run(state, {
    type: "cycle-harvest",
    id,
    day: "2026-09-15",
    notes: "",
    quality: "Tốt",
    weight: 2.5,
  });
  const cycle = state.cycles.find((c) => c.id === id)!;
  assert.equal(cycle.lifecycle, "Đã thu hoạch");
  assert.equal(cycle.harvestRecord?.weight, 2.5);
  assert.equal(cycle.timeline?.length, 6);
  assert.equal(currentCycle(state, draft.trayId), undefined);
  assert.equal(
    state.trays.find((t) => t.id === draft.trayId)!.status,
    "Chờ vệ sinh",
  );
  const clean = transition(
    state,
    { type: "tray-status", id: draft.trayId, status: "Sẵn sàng" },
    initialOrders,
    at,
  );
  assert.equal(clean.cycles.find((c) => c.id === id)?.timeline?.length, 6);
  assert.throws(
    () => run(clean, { type: "cycle-save", id, draft }),
    /chỉ được xem/,
  );
});
test("Thu hoạch chu kỳ thuê kết thúc phân bổ, giữ hồ sơ đơn và vị trí cũ", () => {
  const cycle = initialOperations.cycles.find(
    (c) => lifecycleOf(c) === "Sẵn sàng thu hoạch",
  )!;
  const state = run(initialOperations, {
    type: "cycle-harvest",
    id: cycle.id,
    day: "2026-09-15",
    weight: 1.5,
    quality: "Đạt",
    notes: "",
  });
  assert.equal(currentAssignment(state, cycle.trayId), undefined);
  const assignment = state.assignments.find(
    (a) => a.id === cycle.assignmentId,
  )!;
  assert.ok(
    initialOrders.some(
      (o) => o.id === assignment.orderId && o.kind === "rental",
    ),
  );
  assert.equal(
    state.cycles.find((c) => c.id === cycle.id)?.location?.tray,
    cycle.trayId,
  );
  assert.equal(
    initialOperations.assignments.find((a) => a.id === cycle.assignmentId)
      ?.active,
    true,
  );
});
test("Sửa chỉ đổi trường phù hợp, không tự tính lại ngày khi danh mục thay đổi", () => {
  const state = run(initialOperations, { type: "cycle-save", draft });
  const cycle = currentCycle(state, draft.trayId)!;
  const catalog = initialVarieties.map((v) => ({
    ...v,
    referenceGrowthDays: 20,
  }));
  const edited = changeCycle(
    state,
    {
      type: "cycle-save",
      id: cycle.id,
      draft: { ...draft, notes: "Ghi chú mới" },
    },
    initialOrders,
    catalog,
    at,
  );
  assert.equal(edited.cycles[0].harvest, cycle.harvest);
  assert.equal(edited.cycles[0].timeline?.[0].text, "Đã tạo chu kỳ");
  assert.throws(
    () =>
      run(state, {
        type: "cycle-save",
        id: cycle.id,
        draft: { ...draft, trayId: "KH-A16" },
      }),
    /Không thay đổi/,
  );
});
test("Hủy yêu cầu lý do, không cho ngày tương lai hoặc sửa chu kỳ đã hủy", () => {
  const state = run(initialOperations, { type: "cycle-save", draft });
  const id = currentCycle(state, draft.trayId)!.id;
  assert.throws(
    () =>
      run(state, { type: "cycle-cancel", id, day: "2026-09-15", notes: "" }),
    /lý do/,
  );
  assert.throws(
    () =>
      run(state, {
        type: "cycle-cancel",
        id,
        day: "2026-09-16",
        notes: "Không đạt",
      }),
    /hôm nay/,
  );
  const next = run(state, {
    type: "cycle-cancel",
    id,
    day: "2026-09-15",
    notes: "Không đạt",
  });
  assert.equal(next.cycles[0].lifecycle, "Đã hủy");
  assert.throws(
    () =>
      run(next, {
        type: "cycle-stage",
        id,
        day: "2026-09-15",
        notes: "",
        stage: "Đã gieo",
      }),
    /chỉ được xem/,
  );
});
