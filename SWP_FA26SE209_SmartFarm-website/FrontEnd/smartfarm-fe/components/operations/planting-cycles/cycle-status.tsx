import { Badge } from "@/components/ui/badge";
import { stageLabel } from "@/lib/operations/cycles";
import type { CycleStage } from "@/lib/operations/types";
const tones: Record<CycleStage, string> = {
  "Chuẩn bị": "bg-slate-100 text-slate-600",
  "Đã gieo": "bg-blue-50 text-blue-700",
  "Nảy mầm": "bg-teal-50 text-teal-700",
  "Sinh trưởng": "bg-[#E8F3EB] text-[#3F7655]",
  "Sẵn sàng thu hoạch": "bg-amber-50 text-amber-700",
  "Đã thu hoạch": "bg-green-50 text-green-700",
  "Đã hủy": "bg-red-50 text-red-600",
};
export function CycleStatus({ stage, prominent = false }: { stage: CycleStage; prominent?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        (prominent
          ? "whitespace-nowrap rounded-md border border-current/20 px-3 py-1.5 text-sm font-semibold "
          : "whitespace-nowrap border-0 rounded-md px-2.5 py-1 text-[11px] font-medium ") +
        tones[stage]
      }
    >
      {stageLabel(stage)}
    </Badge>
  );
}
