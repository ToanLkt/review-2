"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Field, Choice, FormError } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { lifecycleOf, stageLabel } from "@/lib/operations/cycles";
import { cycleStages, type PlantingCycle } from "@/lib/operations/types";
import { CycleStatus } from "./cycle-status";
import { LocalDatePicker } from "@/components/ui/local-date-picker";
import { CycleProgress } from "./cycle-progress";
export type CycleActionMode = "stage" | "harvest" | "cancel";
export function CycleActionForm({
  cycle,
  mode,
  onSaved,
}: {
  cycle: PlantingCycle;
  mode: CycleActionMode;
  onSaved: () => void;
}) {
  const { execute } = useOperations();
  const [day, setDay] = useState(() =>
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(
      new Date(),
    ),
  );
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState("");
  const [quality, setQuality] = useState<"Tốt" | "Đạt" | "Không đạt">("Tốt");
  const current = lifecycleOf(cycle);
  const availableStages = cycleStages.slice(cycleStages.indexOf(current) + 1).filter(
    (stage) => stage !== "Đã thu hoạch" && stage !== "Đã hủy",
  );
  const [stage, setStage] = useState<(typeof cycleStages)[number]>(availableStages[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const common = { id: cycle.id, day, notes };
    const result = await execute(
      mode === "harvest"
        ? { ...common, type: "cycle-harvest", weight: Number(weight), quality }
        : mode === "cancel"
          ? { ...common, type: "cycle-cancel" }
          : { ...common, type: "cycle-stage", stage },
      mode === "harvest"
        ? "Đã ghi nhận thu hoạch. Khay chuyển sang chờ vệ sinh."
        : mode === "cancel"
          ? "Đã hủy chu kỳ. Khay chuyển sang chờ vệ sinh."
          : "Đã cập nhật giai đoạn.",
    );
    if (result.ok) onSaved();
    else setErrors({ [result.field]: result.message });
  }
  return (
    <form id="cycle-form" noValidate onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Giai đoạn hiện tại</p>
        <CycleStatus stage={current} />
      </div>
      {mode === "stage" && <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giai đoạn tiếp theo" error={errors.stage}>
            <Choice
              label="Giai đoạn tiếp theo"
              value={stage}
              onChange={(value) => setStage(value as typeof stage)}
              options={availableStages.map((value) => ({ value, label: stageLabel(value) }))}
            />
          </Field>
          <Field label="Ngày cập nhật" error={errors.day}>
            <LocalDatePicker label="Ngày cập nhật chu kỳ" value={day} onChange={setDay} />
          </Field>
        </div>
        <CycleProgress cycle={cycle} selectedStage={stage} />
      </>}
      {mode === "cancel" && (
        <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
          Xác nhận hủy chu kỳ {cycle.id}. Khay sẽ chuyển sang chờ vệ sinh. Thông
          tin đơn thuê và lịch sử trồng được giữ lại.
        </p>
      )}
      {mode !== "stage" && <Field
        label={mode === "harvest" ? "Ngày thu hoạch *" : "Ngày cập nhật"}
        error={errors.day}
      >
        <LocalDatePicker label="Ngày cập nhật chu kỳ" value={day} onChange={setDay} />
      </Field>}
      {mode === "harvest" && (
        <>
          <Field
            label="Khối lượng thu hoạch (kg) *"
            htmlFor="cycle-weight"
            error={errors.weight}
          >
            <Input
              id="cycle-weight"
              type="number"
              min="0.001"
              step="0.001"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-invalid={!!errors.weight}
            />
          </Field>
          <Field label="Chất lượng" error={errors.quality}>
            <Choice
              label="Chất lượng thu hoạch"
              value={quality}
              onChange={(v) => setQuality(v as typeof quality)}
              options={["Tốt", "Đạt", "Không đạt"].map((v) => ({
                value: v,
                label: v,
              }))}
            />
          </Field>
        </>
      )}
      <Field
        label={mode === "cancel" ? "Lý do hủy *" : "Ghi chú"}
        htmlFor="cycle-action-notes"
        error={errors.notes}
      >
        <textarea
          id="cycle-action-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border p-3 text-sm"
          placeholder={
            mode === "cancel" ? "Nhập lý do hủy chu kỳ..." : "Nhập ghi chú..."
          }
        />
      </Field>
      <FormError message={errors.form} />
    </form>
  );
}
