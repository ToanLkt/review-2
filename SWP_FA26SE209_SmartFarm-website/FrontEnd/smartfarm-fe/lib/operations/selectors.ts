import type {
  GrowingArea,
  OperationsState,
  PhysicalTray,
  TrayPosition,
} from "./types";
export function positionsForArea(area: GrowingArea): TrayPosition[] {
  return area.shelves.flatMap((s) =>
    Array.from({ length: s.levels }, (_, l) =>
      Array.from({ length: s.positionsPerLevel }, (_, i) => ({
        id: area.id + "/" + s.id + "/" + (l + 1) + "/" + (i + 1),
        areaId: area.id,
        shelfId: s.id,
        level: l + 1,
        slot: i + 1,
      })),
    ).flat(),
  );
}
export function allPositions(state: OperationsState) {
  return state.areas.flatMap(positionsForArea);
}
export function locationOf(state: OperationsState, tray: PhysicalTray) {
  const position = allPositions(state).find((p) => p.id === tray.positionId);
  const area = state.areas.find((a) => a.id === position?.areaId);
  const shelf = area?.shelves.find((s) => s.id === position?.shelfId);
  return {
    position,
    area,
    shelf,
    label:
      position && area && shelf
        ? `${area.name} · ${shelf.name} · Tầng ${position.level} · Vị trí ${position.slot}`
        : "Chưa bố trí",
  };
}
export function currentAssignment(state: OperationsState, id: string) {
  return state.assignments.find((a) => a.trayId === id && a.active);
}
export function currentCycle(state: OperationsState, id: string) {
  return state.cycles.find((c) => c.trayId === id && c.active);
}
export function areaStats(state: OperationsState, area: GrowingArea) {
  const positions = positionsForArea(area);
  const ids = new Set(positions.map((p) => p.id));
  const trays = state.trays.filter(
    (t) => t.positionId && ids.has(t.positionId),
  );
  return {
    positions: positions.length,
    installed: trays.length,
    available: trays.filter((t) => t.status === "Sẵn sàng").length,
    growing: trays.filter((t) => t.status === "Đang trồng").length,
    maintenance: trays.filter((t) => t.status === "Bảo trì").length,
    ready: trays.filter(
      (t) => currentCycle(state, t.id)?.stage === "Sẵn sàng thu hoạch",
    ).length,
    trays,
  };
}
export function remaining(state: OperationsState, itemId: string) {
  const item = state.items.find((i) => i.id === itemId);
  return item
    ? item.quantity -
        state.assignments.filter((a) => a.itemId === itemId).length
    : 0;
}
export function vacantPositions(
  state: OperationsState,
  excludeTrayId?: string,
) {
  const occupied = new Set(
    state.trays.filter((t) => t.id !== excludeTrayId).map((t) => t.positionId),
  );
  return allPositions(state).filter(
    (p) =>
      !occupied.has(p.id) &&
      state.areas.find((a) => a.id === p.areaId)?.status === "Hoạt động",
  );
}
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
