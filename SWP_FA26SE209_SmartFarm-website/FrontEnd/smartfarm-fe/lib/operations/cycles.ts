import type { Order } from "@/lib/types";
import type { Variety } from "@/lib/varieties";
import type {
  CycleDraft,
  CycleStage,
  OperationsState,
  PlantingCycle,
} from "./types";
import { cycleStages } from "./types";
import {
  currentAssignment,
  currentCycle,
  locationOf,
  normalize,
  remaining,
} from "./selectors";

export const lifecycleOf = (c: PlantingCycle): CycleStage =>
  c.lifecycle ??
  (!c.active
    ? "Đã thu hoạch"
    : c.stage === "Ươm mầm"
      ? "Nảy mầm"
      : c.stage === "Đang phát triển"
        ? "Sinh trưởng"
        : "Sẵn sàng thu hoạch");
export const stageLabel = (stage: CycleStage) =>
  stage === "Sinh trưởng" ? "Đang sinh trưởng" : stage;
export const validDay = (day: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(day) &&
  Number.isFinite(Date.parse(day)) &&
  new Date(day).toISOString().slice(0, 10) === day;
export function expectedHarvest(day: string, days: number) {
  if (!validDay(day) || !Number.isInteger(days) || days < 1) return "";
  const value = new Date(day + "T00:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function cycleLocation(state: OperationsState, cycle: PlantingCycle) {
  if (cycle.location) return cycle.location;
  const tray = state.trays.find((t) => t.id === cycle.trayId)!;
  const loc = locationOf(state, tray);
  return {
    areaId: loc.area?.id ?? "",
    area: loc.area?.name ?? "—",
    shelfId: loc.shelf?.id ?? "",
    shelf: loc.shelf?.name ?? "—",
    tray: tray.code,
  };
}
export function cycleTimeline(c: PlantingCycle) {
  return (
    c.timeline ?? [
      {
        text: "Đã tạo chu kỳ",
        at: c.sowed + "T07:30:00+07:00",
        staff: "Nguyễn Minh",
        notes: "",
      },
      {
        text: stageLabel(lifecycleOf(c)),
        at: c.sowed + "T08:00:00+07:00",
        staff: "Minh Anh",
        notes: "",
      },
    ]
  );
}
export type CycleOperation =
  | { type: "cycle-save"; id?: string; draft: CycleDraft }
  | {
      type: "cycle-stage";
      id: string;
      stage: CycleStage;
      day: string;
      notes: string;
    }
  | {
      type: "cycle-harvest";
      id: string;
      day: string;
      weight: number;
      quality: "Tốt" | "Đạt" | "Không đạt";
      notes: string;
    }
  | { type: "cycle-cancel"; id: string; day: string; notes: string };
export class CycleError extends Error {
  constructor(
    message: string,
    public field = "form",
  ) {
    super(message);
  }
}
function fail(message: string, field = "form"): never {
  throw new CycleError(message, field);
}

export function changeCycle(
  previous: OperationsState,
  action: CycleOperation,
  orders: Order[],
  catalog: Variety[],
  at: string,
): OperationsState {
  const state = structuredClone(previous);
  state.revision++;
  let cycle = state.cycles.find((c) => c.id === action.id);
  if (action.id && !cycle) fail("Không tìm thấy chu kỳ.");
  if (cycle && !cycle.active) fail("Chu kỳ đã kết thúc chỉ được xem chi tiết.");
  if (action.type === "cycle-save") {
    const d = action.draft;
    if (!validDay(d.sowed)) fail("Vui lòng chọn ngày gieo hợp lệ.", "sowed");
    const variety = catalog.find((v) => v.id === d.varietyId);
    if (!variety) fail("Vui lòng chọn giống rau.", "varietyId");
    const tray = state.trays.find((t) => t.id === d.trayId);
    if (!tray) fail("Vui lòng chọn khay trồng.", "trayId");
    const loc = locationOf(state, tray);
    if (!loc.area || !loc.shelf || loc.area.status !== "Hoạt động")
      fail("Khay phải được bố trí trong khu vực hoạt động.", "trayId");
    if (cycle) {
      const currentVariety =
        cycle.varietyId ??
        catalog.find((v) => normalize(v.name) === normalize(cycle!.seed))?.id;
      if (d.trayId !== cycle.trayId || d.varietyId !== currentVariety)
        fail("Không thay đổi giống và khay của chu kỳ đã tạo.");
      if (lifecycleOf(cycle) !== "Chuẩn bị" && d.sowed !== cycle.sowed)
        fail("Không thay đổi ngày gieo sau khi đã gieo.", "sowed");
      cycle.timeline = cycleTimeline(cycle);
      cycle.harvest =
        d.sowed === cycle.sowed
          ? cycle.harvest
          : expectedHarvest(
              d.sowed,
              cycle.growthDays ?? variety.referenceGrowthDays,
            );
      cycle.sowed = d.sowed;
      cycle.notes = d.notes.trim();
      cycle.timeline.push({
        text: "Chỉnh sửa thông tin chu kỳ",
        at,
        notes: cycle.notes,
        staff: "Nguyễn Minh",
      });
      return state;
    }
    if (
      (tray.status !== "Sẵn sàng" &&
        !(tray.status === "Đã giữ chỗ" && currentAssignment(state, tray.id))) ||
      currentCycle(state, tray.id)
    )
      fail(
        "Chỉ tạo chu kỳ cho khay sẵn sàng và chưa có chu kỳ hoạt động.",
        "trayId",
      );
    let assignment = currentAssignment(state, tray.id);
    if (!variety.enabledForNewRentals && !assignment)
      fail("Giống rau đang tắt chọn cho đơn mới.", "varietyId");
    const item = state.items.find(
      (i) => i.id === (assignment?.itemId || d.itemId),
    );
    if (d.itemId || assignment) {
      if (!item) fail("Vui lòng chọn dòng hàng thuê hợp lệ.", "itemId");
      const order = orders.find((o) => o.id === item.orderId);
      if (
        !order ||
        order.kind !== "rental" ||
        order.payment !== "Đã xác nhận" ||
        ["Hoàn tất", "Đã hủy"].includes(order.status)
      )
        fail("Đơn thuê phải đã thanh toán và còn hiệu lực.", "itemId");
      if (normalize(item.seed) !== normalize(variety.name))
        fail("Giống rau phải khớp dòng hàng thuê.", "itemId");
      if (!assignment && remaining(state, item.id) <= 0)
        fail("Đơn thuê đã được phân bổ đủ khay.", "itemId");
      if (!assignment) {
        assignment = {
          id: "PB-CK-" + state.revision,
          trayId: tray.id,
          itemId: item.id,
          orderId: order.id,
          customer: order.customer,
          assignedAt: at,
          active: true,
        };
        state.assignments.push(assignment);
        tray.history.push({
          id: "PB-" + state.revision,
          type: "assignment",
          text: "Phân bổ đơn thuê " + order.id,
          at,
          staff: "Nguyễn Minh",
        });
      }
    }
    const prefix = "CK-" + at.slice(2, 7).replace("-", "") + "-";
    const id =
      prefix +
      String(
        Math.max(
          0,
          ...state.cycles
            .filter((c) => c.id.startsWith(prefix))
            .map((c) => Number(c.id.slice(prefix.length)) || 0),
        ) + 1,
      ).padStart(2, "0");
    cycle = {
      id,
      trayId: tray.id,
      assignmentId: assignment?.id ?? "",
      varietyId: variety.id,
      seed: variety.name,
      growthDays: variety.referenceGrowthDays,
      sowed: d.sowed,
      harvest: expectedHarvest(d.sowed, variety.referenceGrowthDays),
      stage: "Ươm mầm",
      lifecycle: "Chuẩn bị",
      active: true,
      notes: d.notes.trim(),
      location: {
        areaId: loc.area.id,
        area: loc.area.name,
        shelfId: loc.shelf.id,
        shelf: loc.shelf.name,
        tray: tray.code,
      },
      timeline: [
        {
          text: "Đã tạo chu kỳ",
          at,
          staff: "Nguyễn Minh",
          notes: d.notes.trim(),
        },
      ],
    };
    state.cycles.unshift(cycle);
    tray.status = "Đang trồng";
    tray.history.push({
      id: id + "-create",
      type: "cycle",
      text: "Tạo chu kỳ " + id,
      at,
      staff: "Nguyễn Minh",
    });
    return state;
  }
  if (!cycle) fail("Không tìm thấy chu kỳ.");
  const timeline = cycleTimeline(cycle);
  const last = timeline.at(-1)!.at.slice(0, 10);
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(at));
  if (!validDay(action.day) || action.day < last || action.day > today)
    fail("Ngày cập nhật phải từ sự kiện gần nhất đến hôm nay.", "day");
  const tray = state.trays.find((t) => t.id === cycle!.trayId)!;
  const current = lifecycleOf(cycle);
  let next: CycleStage;
  if (action.type === "cycle-stage") {
    next = action.stage;
    if (
      !cycleStages.slice(cycleStages.indexOf(current) + 1).includes(next) ||
      next === "Đã thu hoạch" || next === "Đã hủy"
    )
      fail(
        "Chọn giai đoạn sau giai đoạn hiện tại; sử dụng Ghi nhận thu hoạch để kết thúc.",
        "stage",
      );
    if (next === "Đã gieo" && action.day !== cycle.sowed)
      fail(
        "Ngày cập nhật phải khớp ngày gieo. Hãy chỉnh sửa ngày gieo trước nếu cần.",
        "day",
      );
  } else if (action.type === "cycle-harvest") {
    if (current !== "Sẵn sàng thu hoạch")
      fail("Chỉ ghi nhận khi chu kỳ sẵn sàng thu hoạch.");
    if (!Number.isFinite(action.weight) || action.weight <= 0)
      fail("Khối lượng phải lớn hơn 0 kg.", "weight");
    if (!["Tốt", "Đạt", "Không đạt"].includes(action.quality))
      fail("Chọn chất lượng thu hoạch.", "quality");
    next = "Đã thu hoạch";
    cycle.harvestRecord = {
      at: action.day,
      weight: action.weight,
      quality: action.quality,
      notes: action.notes.trim(),
    };
  } else {
    if (!action.notes.trim()) fail("Vui lòng nhập lý do hủy chu kỳ.", "notes");
    next = "Đã hủy";
  }
  cycle.location = cycleLocation(state, cycle);
  cycle.lifecycle = next;
  cycle.stage =
    next === "Sẵn sàng thu hoạch"
      ? "Sẵn sàng thu hoạch"
      : next === "Sinh trưởng"
        ? "Đang phát triển"
        : cycle.stage;
  cycle.timeline = [
    ...timeline,
    {
      text: stageLabel(next),
      at: action.day === today ? at : action.day + "T23:59:00+07:00",
      staff: "Nguyễn Minh",
      notes: action.notes.trim(),
    },
  ];
  if (next === "Đã thu hoạch" || next === "Đã hủy") {
    cycle.active = false;
    tray.status = "Chờ vệ sinh";
    const assignment = state.assignments.find(
      (a) => a.id === cycle!.assignmentId,
    );
    if (assignment) assignment.active = false;
  }
  tray.history.push({
    id: cycle.id + "-" + state.revision,
    type: "cycle",
    text: cycle.id + " · " + stageLabel(next),
    at: action.day === today ? at : action.day + "T23:59:00+07:00",
    staff: "Nguyễn Minh",
  });
  return state;
}
