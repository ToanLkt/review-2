import { trays as crops, initialOrders, devices, NOW } from "@/lib/mock-data";
import type {
  OperationsState,
  GrowingArea,
  PhysicalTray,
  RentalItem,
  PlantingCycle,
} from "./types";
import { positionsForArea, locationOf } from "./selectors";
import { initialVarieties } from "@/lib/varieties";
import { expectedHarvest, lifecycleOf, stageLabel } from "./cycles";
const areas: GrowingArea[] = ["A", "B", "C", "D"].map((letter, i) => ({
  id: letter,
  code: "KV-" + letter,
  name: "Khu " + letter,
  location: [
    "Khu trồng chính · Tầng 1",
    "Khu trồng mở rộng · Tầng 2",
    "Khu ươm · Tầng 1",
    "Khu dự phòng · Tầng 2",
  ][i],
  description: [
    "Không gian trồng chính với hệ thống chiếu sáng và tưới tự động.",
    "Khu vực mở rộng dành cho các đơn thuê khay.",
    "Không gian ươm mầm và chăm sóc cây non.",
    "Không gian dự phòng cho các đợt trồng mới.",
  ][i],
  status: i === 3 ? "Bảo trì" : "Hoạt động",
  shelves: Array.from({ length: 2 }, (_, j) => ({
    id: letter + "-K" + (j + 1),
    name: "Kệ " + String(j + 1).padStart(2, "0"),
    levels: 2,
    positionsPerLevel: i === 0 ? 4 : i === 3 ? 2 : 3,
  })),
}));
const items: RentalItem[] = initialOrders
  .filter((o) => o.kind === "rental")
  .flatMap((o) => {
    const linked = crops.filter((t) => t.orderId === o.id);
    return [...new Set(linked.map((t) => t.seed))].map((seed, i) => ({
      id: o.id + "-SP" + (i + 1),
      orderId: o.id,
      seed,
      quantity:
        linked.filter((t) => t.seed === seed).length + (i === 0 ? 2 : 0),
    }));
  });
const trays: PhysicalTray[] = areas
  .filter((a) => a.id !== "D")
  .flatMap((a) =>
    positionsForArea(a).map((p, i) => {
      const code = "KH-" + a.id + String(i + 1).padStart(2, "0");
      const crop = crops.find((t) => t.id === code);
      const extraStatus: Record<string, PhysicalTray["status"]> = {
        "KH-A15": "Sẵn sàng",
        "KH-A16": "Sẵn sàng",
        "KH-B11": "Đã giữ chỗ",
        "KH-B12": "Chờ vệ sinh",
        "KH-C09": "Bảo trì",
        "KH-C10": "Bảo trì",
        "KH-C11": "Sẵn sàng",
        "KH-C12": "Sẵn sàng",
      };
      return {
        id: code,
        code,
        specification: "Khay nhựa thực phẩm · 60 × 40 × 5 cm",
        positionId: code === "KH-C11" || code === "KH-C12" ? null : p.id,
        status: crop ? "Đang trồng" : extraStatus[code],
        notes: "",
        history: [
          {
            id: code + "-01",
            type: "created",
            text: "Tiếp nhận khay vật lý",
            at: "2026-09-01T08:00:00+07:00",
            staff: "Nguyễn Minh",
          },
          {
            id: code + "-02",
            type: "location",
            text:
              "Bố trí khay tại " +
              a.name +
              " · " +
              a.shelves.find((s) => s.id === p.shelfId)?.name +
              " · tầng " +
              p.level +
              " · vị trí " +
              p.slot,
            at: "2026-09-02T08:00:00+07:00",
            staff: "Quốc Bảo",
          },
        ],
      };
    }),
  );
const assignments = crops.map((t) => ({
  id: "PB-" + t.id,
  trayId: t.id,
  itemId: items.find((i) => i.orderId === t.orderId && i.seed === t.seed)!.id,
  orderId: t.orderId,
  customer: t.customer,
  active: true,
  assignedAt: "2026-09-07T09:00:00+07:00",
}));
assignments.push({
  id: "PB-KH-B11",
  trayId: "KH-B11",
  itemId: items[0].id,
  orderId: items[0].orderId,
  customer: initialOrders[0].customer,
  active: true,
  assignedAt: NOW,
});
const cycles: PlantingCycle[] = crops.map((t) => ({
  id: t.cycle,
  trayId: t.id,
  assignmentId: "PB-" + t.id,
  seed: t.seed,
  sowed: t.sowed,
  harvest: t.harvest,
  stage: t.stage,
  active: true,
  varietyId: initialVarieties.find((v) => v.name === t.seed)?.id,
  growthDays: Math.round(
    (Date.parse(t.harvest) - Date.parse(t.sowed)) / 86400000,
  ),
}));
for (const cycle of cycles) {
  const phase = lifecycleOf(cycle);
  cycle.lifecycle = phase;
  cycle.timeline = [
    {
      text: "Đã tạo chu kỳ",
      at: cycle.sowed + "T07:30:00+07:00",
      staff: "Nguyễn Minh",
      notes: "",
    },
    {
      text: "Đã gieo",
      at: cycle.sowed + "T08:00:00+07:00",
      staff: "Minh Anh",
      notes: "",
    },
    {
      text: "Nảy mầm",
      at: expectedHarvest(cycle.sowed, 1) + "T09:15:00+07:00",
      staff: "Minh Anh",
      notes: "",
    },
  ];
  if (phase !== "Nảy mầm")
    cycle.timeline.push({
      text: "Sinh trưởng",
      at: expectedHarvest(cycle.sowed, 2) + "T08:20:00+07:00",
      staff: "Minh Anh",
      notes: "",
    });
  if (phase === "Sẵn sàng thu hoạch")
    cycle.timeline.push({
      text: stageLabel(phase),
      at: "2026-09-15T08:30:00+07:00",
      staff: "Nguyễn Minh",
      notes: "",
    });
}
// Archived cycles reuse physical trays without changing current occupancy.
for (const [i, trayId] of ["KH-B12", "KH-C09"].entries()) {
  const item = items[i];
  const assignmentId = "";
  cycles.push({
    id: "CK-2608-0" + (i + 1),
    trayId,
    assignmentId,
    seed: item.seed,
    varietyId: initialVarieties.find((v) => v.name === item.seed)?.id,
    sowed: "2026-08-20",
    harvest: "2026-08-27",
    growthDays: 7,
    stage: "Sẵn sàng thu hoạch",
    lifecycle: i === 0 ? "Đã thu hoạch" : "Đã hủy",
    active: false,
    timeline: [
      {
        text: "Đã tạo chu kỳ",
        at: "2026-08-20T08:00:00+07:00",
        staff: "Nguyễn Minh",
        notes: "",
      },
      {
        text: i === 0 ? "Đã thu hoạch" : "Đã hủy",
        at: "2026-08-27T09:00:00+07:00",
        staff: "Minh Anh",
        notes:
          i === 0 ? "Hoàn tất đợt thu hoạch." : "Khay cần kiểm tra bề mặt.",
      },
    ],
    ...(i === 0
      ? {
          harvestRecord: {
            at: "2026-08-27",
            weight: 1.8,
            quality: "Tốt" as const,
            notes: "",
          },
        }
      : {}),
  });
}
for (const t of trays) {
  if (!t.positionId)
    t.history.push({
      id: t.id + "-KHO",
      type: "location",
      text: "Đưa khay về kho dự phòng, chưa bố trí vị trí mới",
      at: NOW,
      staff: "Quốc Bảo",
    });
  const assignment = assignments.find((a) => a.trayId === t.id);
  const cycle = cycles.find((c) => c.trayId === t.id);
  if (assignment)
    t.history.push({
      id: t.id + "-PB",
      type: "assignment",
      text:
        "Phân bổ đơn thuê " + assignment.orderId + " · " + assignment.customer,
      at: assignment.assignedAt,
      staff: "Nguyễn Minh",
    });
  if (cycle)
    t.history.push({
      id: t.id + "-CK",
      type: "cycle",
      text: "Bắt đầu chu kỳ " + cycle.id + " · " + cycle.seed,
      at: cycle.sowed + "T08:00:00+07:00",
      staff: "Minh Anh",
    });
  if (t.status === "Bảo trì")
    t.history.push({
      id: t.id + "-BT",
      type: "maintenance",
      text: "Chuyển bảo trì: kiểm tra bề mặt và lỗ thoát nước",
      at: NOW,
      staff: "Quốc Bảo",
    });
}
export const initialOperations: OperationsState = {
  areas,
  trays,
  items,
  assignments,
  cycles,
  revision: 0,
  devices: [
    ...devices.map((d) => ({
      ...d,
      areaId: d.area.slice(-1),
      name: "Cảm biến môi trường " + d.id,
      kind: "sensor" as const,
      water: "Bình thường",
    })),
    ...["A", "B", "C"].map((a) => ({
      id: "TB-" + a,
      areaId: a,
      name: "Bộ điều khiển tưới " + a,
      kind: "actuator" as const,
      online: true,
      received: NOW,
    })),
  ],
};
for (const cycle of initialOperations.cycles) {
  const tray = initialOperations.trays.find((t) => t.id === cycle.trayId)!;
  const loc = locationOf(initialOperations, tray);
  cycle.location = {
    areaId: loc.area!.id,
    area: loc.area!.name,
    shelfId: loc.shelf!.id,
    shelf: loc.shelf!.name,
    tray: tray.code,
  };
}
