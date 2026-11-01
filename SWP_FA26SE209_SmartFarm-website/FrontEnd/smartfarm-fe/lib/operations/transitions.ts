import type { Order } from "@/lib/types";
import type {
  OperationsState,
  AreaDraft,
  TrayDraft,
  TrayStatus,
} from "./types";
import { normalizeZoneName } from "./farm-workflow";
import {
  areaStats,
  positionsForArea,
  allPositions,
  locationOf,
  remaining,
} from "./selectors";
export type Operation =
  | { type: "area-save"; id?: string; pendingZoneId?: string; draft: AreaDraft }
  | { type: "area-maintenance"; id: string }
  | { type: "tray-save"; id?: string; draft: TrayDraft }
  | { type: "tray-move"; id: string; positionId: string }
  | { type: "tray-status"; id: string; status: TrayStatus }
  | { type: "allocate"; id: string; itemId: string };
export class ValidationError extends Error {
  constructor(
    message: string,
    public field = "form",
  ) {
    super(message);
  }
}
function fail(message: string, field = "form"): never {
  throw new ValidationError(message, field);
}
const validCode = (code: string) => /^[A-Z0-9][A-Z0-9-]{1,23}$/.test(code);
export function transition(
  previous: OperationsState,
  action: Operation,
  orders: Order[],
  at: string,
): OperationsState {
  const state = structuredClone(previous);
  state.revision++;
  const event = (
    id: string,
    type: "location" | "maintenance" | "cleaning" | "assignment" | "created",
    text: string,
  ) =>
    state.trays
      .find((t) => t.id === id)!
      .history.push({
        id: id + "-E" + state.revision,
        type,
        text,
        at,
        staff: "Nguyễn Minh",
      });
  const validatePosition = (positionId: string | null, id?: string) => {
    if (!positionId) return;
    const p = allPositions(state).find((p) => p.id === positionId);
    if (!p)
      fail(
        "Vị trí không thuộc cấu hình khu vực, kệ và tầng hiện tại.",
        "positionId",
      );
    if (state.areas.find((a) => a.id === p.areaId)?.status !== "Hoạt động")
      fail("Chỉ bố trí khay trong khu vực hoạt động.", "positionId");
    if (state.trays.some((t) => t.id !== id && t.positionId === positionId))
      fail("Vị trí đã có khay. Vui lòng chọn vị trí khác.", "positionId");
  };
  if (action.type === "area-save") {
    const d = action.draft;
    d.name = normalizeZoneName(d.name);
    d.location = d.location.trim();
    if (!d.name) fail("Vui lòng nhập tên khu vực sau chữ Khu.", "name");
    if (d.name.length > 100) fail("Tên khu vực tối đa 100 ký tự.", "name");
    if (
      state.areas.some(
        (a) => a.id !== action.id && a.id !== action.pendingZoneId && normalizeZoneName(a.name).toUpperCase() === d.name.toUpperCase(),
      )
    )
      fail("Tên khu vực đã tồn tại.", "name");
    if (!d.shelves.length || d.shelves.length > 20)
      fail("Cấu hình từ 1 đến 20 kệ.", "shelves");
    if (
      new Set(d.shelves.map((s) => s.id)).size !== d.shelves.length ||
      new Set(d.shelves.map((s) => s.name.trim().toLowerCase())).size !==
        d.shelves.length
    )
      fail("Tên và mã nội bộ của mỗi kệ phải khác nhau.", "shelves");
    for (const s of d.shelves)
      if (
        !s.name.trim() ||
        s.name.trim().length > 50 ||
        !Number.isInteger(s.levels) ||
        s.levels < 1 ||
        s.levels > 10 ||
        !Number.isInteger(s.positionsPerLevel) ||
        s.positionsPerLevel < 1 ||
        s.positionsPerLevel > 20
      )
        fail("Mỗi kệ cần mã tối đa 50 ký tự, 1–10 tầng và 1–20 vị trí mỗi tầng.", "shelves");
    const old = state.areas.find((a) => a.id === action.id);
    if (action.id && !old) fail("Không tìm thấy khu vực.");
    const area = {
      ...d,
      id: old?.id ?? "AREA-" + state.revision,
      status: old?.status ?? ("Hoạt động" as const),
    };
    const newPositions = new Set(positionsForArea(area).map((p) => p.id));
    if (old) {
      const removed = areaStats(state, old).trays.filter(
        (t) => !newPositions.has(t.positionId!),
      );
      if (removed.length)
        fail(
          "Không thể thu hẹp hoặc xóa vị trí đang chứa: " +
            removed.map((t) => t.code).join(", ") +
            ". Hãy di chuyển các khay trước.",
          "shelves",
        );
      state.areas = state.areas.map((a) => (a.id === old.id ? area : a));
    } else state.areas.push(area);
    return state;
  }
  if (action.type === "area-maintenance") {
    const area = state.areas.find((a) => a.id === action.id);
    if (!area) fail("Không tìm thấy khu vực.");
    const growing = areaStats(state, area).trays.filter(
      (t) => t.status === "Đang trồng",
    );
    if (growing.length)
      fail(
        "Không thể bảo trì khi còn khay đang trồng: " +
          growing.map((t) => t.code).join(", "),
      );
    if (area.status !== "Hoạt động")
      fail("Khu vực không ở trạng thái hoạt động.");
    area.status = "Bảo trì";
    return state;
  }
  if (action.type === "tray-save") {
    const d = action.draft;
    d.code = d.code.trim().toUpperCase();
    if (!d.positionId) fail("Vui lòng chọn khu vực, kệ, tầng và vị trí cho khay.", "positionId");
    if (!validCode(d.code))
      fail("Mã gồm 2–24 chữ cái, chữ số hoặc dấu gạch ngang.", "code");
    if (
      state.trays.some(
        (t) => t.id !== action.id && t.code.toUpperCase() === d.code,
      )
    )
      fail("Mã khay đã tồn tại.", "code");
    const old = state.trays.find((t) => t.id === action.id);
    if (action.id && (!old || old.status !== "Sẵn sàng"))
      fail("Chỉ chỉnh sửa khay sẵn sàng.");
    if (old && old.positionId !== d.positionId)
      fail("Sử dụng chức năng Di chuyển khay để đổi vị trí.", "positionId");
    if (!old) validatePosition(d.positionId);
    if (old) {
      Object.assign(old, d);
    } else {
      const id = "TRAY-" + state.revision;
      state.trays.push({
        ...d,
        id,
        specification: "Khay trồng",
        status: "Sẵn sàng",
        history: [],
      });
      event(id, "created", "Tạo khay vật lý " + d.code);
      if (d.positionId)
        event(
          id,
          "location",
          "Bố trí tại " + locationOf(state, state.trays.at(-1)!).label,
        );
    }
    return state;
  }
  const tray = state.trays.find((t) => t.id === action.id);
  if (!tray) fail("Không tìm thấy khay.");
  if (action.type === "tray-move") {
    if (tray.status !== "Sẵn sàng")
      fail(
        "Chỉ di chuyển khay sẵn sàng; không di chuyển khay đang trồng hoặc đã giữ chỗ.",
      );
    if (!action.positionId || tray.positionId === action.positionId)
      fail("Vui lòng chọn vị trí đích khác vị trí hiện tại.", "positionId");
    validatePosition(action.positionId, tray.id);
    const from = locationOf(state, tray).label;
    tray.positionId = action.positionId;
    event(
      tray.id,
      "location",
      "Di chuyển: " + from + " → " + locationOf(state, tray).label,
    );
    return state;
  }
  if (action.type === "tray-status") {
    const allowed =
      (tray.status === "Sẵn sàng" && action.status === "Bảo trì") ||
      ((tray.status === "Bảo trì" || tray.status === "Chờ vệ sinh") &&
        action.status === "Sẵn sàng");
    if (!allowed)
      fail(
        "Không thể thay đổi trạng thái này. Khay đang trồng cần hoàn tất chu kỳ trước.",
      );
    const cleaning = tray.status === "Chờ vệ sinh";
    const completing = action.status === "Sẵn sàng";
    tray.status = action.status;
    event(
      tray.id,
      cleaning ? "cleaning" : "maintenance",
      cleaning
        ? "Xác nhận đã vệ sinh"
        : completing
          ? "Hoàn tất bảo trì"
          : "Chuyển khay sang bảo trì",
    );
    return state;
  }
  if (action.type === "allocate") {
    if (
      tray.status !== "Sẵn sàng" ||
      state.assignments.some((a) => a.trayId === tray.id && a.active)
    )
      fail("Khay không còn sẵn sàng để phân bổ.");
    if (
      !tray.positionId ||
      locationOf(state, tray).area?.status !== "Hoạt động"
    )
      fail("Hãy bố trí khay vào khu vực hoạt động trước khi phân bổ.");
    const item = state.items.find((i) => i.id === action.itemId);
    if (!item) fail("Vui lòng chọn dòng hàng thuê khay.", "itemId");
    const order = orders.find((o) => o.id === item.orderId);
    if (
      !order ||
      order.kind !== "rental" ||
      order.payment !== "Đã xác nhận" ||
      order.status === "Đã hủy" ||
      order.status === "Hoàn tất"
    )
      fail(
        "Chỉ phân bổ đơn thuê đã xác nhận thanh toán và còn hiệu lực.",
        "itemId",
      );
    if (remaining(state, item.id) <= 0)
      fail("Dòng hàng đã được phân bổ đủ khay.", "itemId");
    state.assignments.push({
      id: "PB-" + state.revision,
      trayId: tray.id,
      itemId: item.id,
      orderId: order.id,
      customer: order.customer,
      active: true,
      assignedAt: at,
    });
    tray.status = "Đã giữ chỗ";
    event(
      tray.id,
      "assignment",
      "Phân bổ đơn thuê " +
        order.id +
        " · " +
        item.seed +
        " · " +
        order.customer,
    );
    return state;
  }
  return state;
}
