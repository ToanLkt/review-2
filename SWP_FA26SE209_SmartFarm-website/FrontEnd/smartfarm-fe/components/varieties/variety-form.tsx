"use client";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { VarietyDetail } from "./variety-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useVarieties } from "./varieties-provider";
import { DisableVarietyDialog } from "./disable-dialog";
import {
  validateVariety,
  type Variety,
  type VarietyDraft,
  type VarietyErrors,
} from "@/lib/varieties";
export function VarietyPanel({
  variety,
  onClose,
  initialMode,
  returnFocus,
}: {
  variety?: Variety;
  onClose: () => void;
  initialMode: "create" | "view" | "edit";
  returnFocus: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [discard, setDiscard] = useState(false);
  const { catalog, save, setEnabled } = useVarieties();
  const [draft, setDraft] = useState<VarietyDraft>(
    variety ?? {
      name: "",
      code: "",
      description: "",
      referenceGrowthDays: 7,
      enabledForNewRentals: true,
    },
  );
  const [errors, setErrors] = useState<VarietyErrors>({});
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const initial = variety ?? {
    name: "",
    code: "",
    description: "",
    referenceGrowthDays: 7,
    enabledForNewRentals: true,
  };
  const dirty =
    mode !== "view" &&
    (Object.keys(draft) as (keyof VarietyDraft)[]).some(
      (key) => draft[key] !== initial[key as keyof typeof initial],
    );
  function close() {
    setConfirm(false);
    setDiscard(false);
    onClose();
  }
  function requestClose() {
    if (dirty) setDiscard(true);
    else close();
  }
  async function commit() {
    if (saving) return;
    setSaving(true);
    const result = await save(draft, variety?.id);
    setSaving(false);
    setErrors(result);
    if (!Object.keys(result).length) close();
    else setConfirm(false);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateVariety(draft, catalog, variety?.id);
    setErrors(result);
    if (Object.keys(result).length) return;
    if (variety?.enabledForNewRentals && !draft.enabledForNewRentals) {
      setConfirm(true);
      return;
    }
    void commit();
  }
  return (
    <>
      <Sheet open onOpenChange={(o) => !o && requestClose()}>
        <SheetContent
          side="right"
          className="h-dvh gap-0 overflow-hidden! bg-white"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus();
          }}
          onEscapeKeyDown={(event) => {
            if (confirm || discard) event.preventDefault();
          }}
        >
          <SheetHeader className="shrink-0 border-b px-6 py-6 pr-12">
            <SheetTitle>
              {mode === "view"
                ? variety?.name
                : variety
                  ? "Chỉnh sửa giống rau"
                  : "Thêm giống rau"}
            </SheetTitle>
            {mode !== "view" && (
              <SheetDescription>
                Thông tin tham khảo dùng khi lựa chọn giống cho đơn thuê khay.
              </SheetDescription>
            )}
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {mode === "view" && variety ? (
              <VarietyDetail
                variety={variety}
                onEdit={() => setMode("edit")}
                onToggleAvailability={() => {
                  if (variety.enabledForNewRentals) setConfirm(true);
                  else void setEnabled(variety.id, true);
                }}
              />
            ) : (
              <form
                id="variety-form"
                noValidate
                onSubmit={submit}
                className="space-y-5"
              >
                {(
                  [
                    "name",
                    "code",
                    "description",
                    "referenceGrowthDays",
                  ] as const
                ).map((key) => {
                  const label = {
                    name: "Tên giống rau",
                    code: "Mã giống",
                    description: "Mô tả",
                    referenceGrowthDays:
                      "Thời gian sinh trưởng tham khảo (ngày)",
                  }[key];
                  return (
                    <div key={key} className="space-y-1.5">
                      <label
                        htmlFor={"variety-" + key}
                        className="text-sm font-medium"
                      >
                        {label}
                      </label>
                      {key === "description" ? (
                        <textarea
                          id={"variety-" + key}
                          value={draft.description}
                          onChange={(e) =>
                            setDraft({ ...draft, description: e.target.value })
                          }
                          rows={3}
                          maxLength={2000}
                          className="w-full rounded-lg border p-3 text-sm"
                        />
                      ) : (
                        <Input
                          id={"variety-" + key}
                          aria-invalid={!!errors[key]}
                          aria-describedby={
                            errors[key] ? key + "-error" : undefined
                          }
                          type={
                            key === "referenceGrowthDays" ? "number" : "text"
                          }
                          min={key === "referenceGrowthDays" ? 1 : undefined}
                          step={key === "referenceGrowthDays" ? 1 : undefined}
                          value={
                            key === "referenceGrowthDays"
                              ? Number.isNaN(draft.referenceGrowthDays)
                                ? ""
                                : draft.referenceGrowthDays
                              : draft[key]
                          }
                          readOnly={key === "code"}
                          placeholder={key === "code" && !variety ? "Tự động sau khi lưu" : undefined}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              [key]:
                                key === "referenceGrowthDays"
                                  ? e.target.value === ""
                                    ? NaN
                                    : Number(e.target.value)
                                  : e.target.value,
                            })
                          }
                        />
                      )}{" "}
                      {errors[key] && (
                        <p
                          id={key + "-error"}
                          role="alert"
                          className="text-xs text-destructive"
                        >
                          {errors[key]}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                  <label htmlFor="variety-enabled" className="text-sm">
                    Cho phép chọn khi thuê mới
                  </label>
                  <Switch
                    id="variety-enabled"
                    aria-label={
                      "Cho phép chọn khi thuê mới: " +
                      (draft.name || "giống rau mới")
                    }
                    checked={draft.enabledForNewRentals}
                    onCheckedChange={(v) =>
                      setDraft({ ...draft, enabledForNewRentals: v })
                    }
                  />
                </div>
                {variety && (
                  <p className="text-xs text-muted-foreground">
                    Thời gian tham khảo không thay đổi ngày của các chu kỳ trồng
                    hiện có.
                  </p>
                )}
                {errors.form && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.form}
                  </p>
                )}
              </form>
            )}
          </div>
          {mode !== "view" && (
            <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
              <Button variant="outline" type="button" onClick={requestClose}>
                Hủy
              </Button>
              <Button type="submit" form="variety-form" disabled={saving}>
                {variety ? "Lưu thay đổi" : "Thêm giống rau"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent className="rounded-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Các thay đổi chưa lưu sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction onClick={close}>Bỏ thay đổi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DisableVarietyDialog
        open={confirm}
        onCancel={() => {
          setConfirm(false);
          setDraft({ ...draft, enabledForNewRentals: true });
        }}
        onConfirm={() => {
          if (mode === "view" && variety) {
            void setEnabled(variety.id, false);
            setConfirm(false);
          } else void commit();
        }}
      />
    </>
  );
}
