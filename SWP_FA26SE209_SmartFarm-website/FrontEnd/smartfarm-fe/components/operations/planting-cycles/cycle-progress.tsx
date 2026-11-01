import { Check } from "lucide-react";
import { date } from "@/lib/formatters";
import { lifecycleOf, stageLabel } from "@/lib/operations/cycles";
import { cycleStages, type CycleStage, type PlantingCycle } from "@/lib/operations/types";

export function CycleProgress({ cycle, selectedStage }: { cycle: PlantingCycle; selectedStage?: CycleStage }) {
  const currentStage = lifecycleOf(cycle);
  const stages: CycleStage[] = cycleStages.filter((stage) => stage !== "Đã hủy");
  const currentIndex = stages.indexOf(currentStage);
  const visibleStages = currentStage === "Đã hủy"
    ? [...stages.slice(0, stages.indexOf("Đã thu hoạch")), "Đã hủy" as const]
    : stages;

  return <section>
    <h3 className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiến trình trồng</h3>
    <ol className="ml-1 space-y-0">
      {visibleStages.map((stage, index) => {
        const isCurrent = stage === currentStage;
        const isPrevious = currentStage !== "Đã hủy" && index < currentIndex;
        const isSelected = stage === selectedStage && stage !== currentStage;
        const isCancelled = stage === "Đã hủy";
        return <li key={stage} className={`relative pl-7 ${index < visibleStages.length - 1 ? "border-l border-primary/20 pb-6" : ""}`}>
          <span className={`absolute -left-3 top-0 flex size-6 items-center justify-center rounded-full border-2 border-white ring-2 ring-white ${isCancelled ? "bg-red-100 text-red-700" : isSelected ? "bg-amber-100 text-amber-700" : isCurrent ? "bg-primary text-white" : isPrevious ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-400"}`}>
            {isPrevious ? <Check className="size-3.5" /> : <span className="size-2 rounded-full bg-current" />}
          </span>
          <p className={`text-sm font-medium ${!isCurrent && !isPrevious && !isSelected ? "text-muted-foreground" : ""}`}>{stageLabel(stage)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{isCancelled ? "Chu kỳ đã hủy" : isSelected ? "Giai đoạn sẽ cập nhật" : currentStage === "Đã hủy" ? "Không có lịch sử giai đoạn" : isCurrent ? "Giai đoạn hiện tại" : isPrevious ? "Trước giai đoạn hiện tại" : "Chưa đến"}</p>
          {stage === "Đã gieo" && <p className="mt-1 text-xs text-muted-foreground">Ngày gieo: {date(cycle.sowed)}</p>}
          {stage === "Sẵn sàng thu hoạch" && <p className="mt-1 text-xs text-muted-foreground">Thu hoạch dự kiến: {date(cycle.harvest)}</p>}
        </li>;
      })}
    </ol>
    <p className="mt-4 text-xs text-muted-foreground">Các giai đoạn trước được suy ra từ trạng thái hiện tại; hệ thống chưa lưu thời điểm chuyển từng giai đoạn.</p>
  </section>;
}
