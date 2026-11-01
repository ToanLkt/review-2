"use client";
import { useState } from "react";
import { DiscardDialog } from "../shared/discard-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CycleForm } from "./cycle-form";
import { CycleDetail } from "./cycle-detail";
import { CycleActionForm, type CycleActionMode } from "./cycle-action-form";
import { CycleStatus } from "./cycle-status";
import { lifecycleOf } from "@/lib/operations/cycles";
import type { PlantingCycle } from "@/lib/operations/types";
export type CyclePanelMode = "view" | "create" | CycleActionMode;
const titles = {
  view: "Chi tiết chu kỳ trồng",
  create: "Tạo chu kỳ trồng",
  stage: "Cập nhật giai đoạn",
  harvest: "Ghi nhận thu hoạch",
  cancel: "Hủy chu kỳ",
};
const buttons = {
  view: "Đóng",
  create: "Tạo chu kỳ",
  stage: "Cập nhật giai đoạn",
  harvest: "Xác nhận thu hoạch",
  cancel: "Xác nhận hủy chu kỳ",
};
export function CycleSheet({
  mode,
  cycle,
  initialTray,
  onClose,
  returnFocus,
  onRelated,
}: {
  mode: CyclePanelMode;
  cycle?: PlantingCycle;
  initialTray?: string;
  onClose: () => void;
  returnFocus: () => void;
  onRelated: (kind: "tray" | "variety" | "order") => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  function requestClose() {
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <Sheet open onOpenChange={(v) => !v && requestClose()}>
        <SheetContent
          side="right"
          className="h-dvh max-w-[500px]! gap-0 overflow-hidden! bg-white"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus();
          }}
        >
          <SheetHeader className="shrink-0 border-b px-6 py-5 pr-12">
            <SheetTitle>{titles[mode]}</SheetTitle>
            {mode !== "stage" && mode !== "view" && <SheetDescription>
              {cycle?.id ?? "Chọn giống rau và vị trí để bắt đầu chu kỳ mới."}
            </SheetDescription>}
            {cycle && mode !== "stage" && mode !== "view" && (
              <div className="pt-2">
                <CycleStatus stage={lifecycleOf(cycle)} />
              </div>
            )}
          </SheetHeader>
          <div
            className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
            onChangeCapture={() =>
              !["view", "create"].includes(mode) && setDirty(true)
            }
          >
            <div>
              {mode === "view" && cycle ? (
                <CycleDetail cycle={cycle} onRelated={onRelated} />
              ) : mode === "create" ? (
                <CycleForm
                  cycle={cycle}
                  initialTray={initialTray}
                  onSaved={onClose}
                  onDirtyChange={setDirty}
                />
              ) : (
                cycle && (
                  <CycleActionForm
                    cycle={cycle}
                    mode={mode as CycleActionMode}
                    onSaved={onClose}
                  />
                )
              )}
            </div>
          </div>
          <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
            <>
              <Button variant="outline" onClick={requestClose}>
                {mode === "view" ? "Đóng" : "Hủy"}
              </Button>
              {mode !== "view" && (
                <Button
                  type="submit"
                  form="cycle-form"
                  variant={mode === "cancel" ? "destructive" : "default"}
                >
                  {buttons[mode]}
                </Button>
              )}
            </>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
        creating={mode === "create"}
      />
    </>
  );
}
