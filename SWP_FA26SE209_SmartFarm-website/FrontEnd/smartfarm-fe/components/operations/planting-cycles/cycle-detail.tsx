"use client";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOperations } from "../shared/operations-provider";
import {
  cycleLocation,
  lifecycleOf,
} from "@/lib/operations/cycles";
import type { PlantingCycle } from "@/lib/operations/types";
import { date, number } from "@/lib/formatters";
import { CycleProgress } from "./cycle-progress";
import { CycleStatus } from "./cycle-status";
export function CycleDetail({
  cycle,
  onRelated,
}: {
  cycle: PlantingCycle;
  onRelated: (kind: "tray" | "variety" | "order") => void;
}) {
  const { state } = useOperations();
  const loc = cycleLocation(state, cycle);
  const assignment = state.assignments.find((a) => a.id === cycle.assignmentId);
  const sections = [
    {
      title: "Thông tin chu kỳ",
      rows: [
        ["Mã chu kỳ", cycle.id],
        ["Đợt gieo", cycle.currentCycle && cycle.totalCycles ? `${cycle.currentCycle}/${cycle.totalCycles}` : "—"],
        ["Giống rau", cycle.seed],
        ["Ngày gieo", date(cycle.sowed)],
        ["Thu hoạch dự kiến", date(cycle.harvest)],
      ],
      action: "Xem giống rau",
      kind: "variety" as const,
    },
    {
      title: "Vị trí trồng",
      rows: [
        ["Khu vực", loc.area],
        ["Tầng kệ", loc.shelf],
        ["Khay", loc.tray],
      ],
      action: "Xem khay",
      kind: "tray" as const,
    },
    {
      title: "Thông tin thuê",
      rows: [
        ["Mã đơn", assignment?.orderCode || assignment?.orderId || "—"],
        ["Khách thuê", assignment?.customer ?? "—"],
      ],
      action: assignment ? "Xem đơn thuê" : undefined,
      kind: "order" as const,
    },
  ];
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.title} className="space-y-4 border-b pb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </h3>
          <dl className="space-y-3">
            {section.rows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[135px_minmax(0,1fr)] gap-4 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {section.title === "Thông tin chu kỳ" && (
            <div className="grid grid-cols-[135px_minmax(0,1fr)] items-center gap-4 text-sm">
              <span className="text-muted-foreground">Giai đoạn hiện tại</span>
              <div><CycleStatus stage={lifecycleOf(cycle)} prominent /></div>
            </div>
          )}
          {section.action && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => onRelated(section.kind)}
            >
              {section.action}
              <ArrowUpRight className="size-3.5" />
            </Button>
          )}
        </section>
      ))}
      <CycleProgress cycle={cycle} />
      {cycle.harvestRecord && (
        <section className="rounded-xl bg-secondary/60 p-4 text-sm">
          <h3 className="font-semibold">Kết quả thu hoạch</h3>
          <p className="mt-2">
            {number(cycle.harvestRecord.weight)} kg ·{" "}
            {cycle.harvestRecord.quality}
          </p>
          <p className="mt-1 text-muted-foreground">
            {date(cycle.harvestRecord.at)}
          </p>
        </section>
      )}
      {cycle.notes && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Ghi chú
          </h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {cycle.notes}
          </p>
        </section>
      )}
    </div>
  );
}
