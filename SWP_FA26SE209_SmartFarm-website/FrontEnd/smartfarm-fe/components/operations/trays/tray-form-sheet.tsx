"use client";
import { useState } from "react";
import { DiscardDialog } from "../shared/discard-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FormError, PhysicalStatus } from "../shared/ui";
import { LocationFields } from "./location-fields";
import { useOperations } from "../shared/operations-provider";
import { trayCodeForPosition } from "@/lib/operations/farm-workflow";
import type { PhysicalTray, TrayDraft } from "@/lib/operations/types";
export function TrayFormSheet({
  tray,
  onClose,
}: {
  tray?: PhysicalTray;
  onClose: () => void;
}) {
  const { execute, state } = useOperations();
  const [draft, setDraft] = useState<TrayDraft>({
    code: tray?.code ?? "",
    positionId: tray?.positionId ?? null,
    notes: tray?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initial] = useState(() => JSON.stringify(draft));
  const [locationDirty, setLocationDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  function requestClose() {
    if (saving) return;
    if (JSON.stringify(draft) !== initial || locationDirty) setDiscard(true);
    else onClose();
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!tray && form.get("locationArea") && !draft.positionId) {
      setErrors({ positionId: "Vui lòng chọn đầy đủ vị trí khay." });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const result = await execute(
        { type: "tray-save", id: tray?.id, draft },
        tray ? "Đã cập nhật khay." : "Đã tạo khay sẵn sàng.",
      );
      if (result.ok) onClose();
      else setErrors({ [result.field]: result.message });
    } finally { setSaving(false); }
  }
  return (
    <>
      <Sheet open onOpenChange={(o) => !o && requestClose()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{tray ? "Chỉnh sửa khay" : "Thêm khay"}</SheetTitle>
            <SheetDescription>
              Thông tin khay vật lý và vị trí bố trí trong nông trại.
            </SheetDescription>
          </SheetHeader>
          <form noValidate onSubmit={submit} className="space-y-5 px-6 pb-6">
            <PhysicalStatus status="Sẵn sàng" />
            <Field label="Mã khay (tự động)" htmlFor="tray-code" error={errors.code}>
              <Input
                id="tray-code"
                value={tray ? tray.code : draft.code}
                readOnly
                aria-readonly="true"
                placeholder="Chọn đủ khu vực, kệ, tầng và vị trí"
                aria-invalid={!!errors.code}
              />
            </Field>
            <p className="text-xs text-muted-foreground">Mã khay gồm tên khu vực, mã kệ, tầng và vị trí; tên dài sẽ được rút gọn để phù hợp giới hạn mã.</p>
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Vị trí bố trí</h3>
              <LocationFields
                onDirtyChange={setLocationDirty}
                value={draft.positionId}
                onChange={(positionId) => setDraft((current) => {
                  const area = state.areas.find((item) => item.id === positionId?.split("/")[0]);
                  const rack = area?.shelves.find((item) => item.id === positionId?.split("/")[1]);
                  return { ...current, positionId, code: tray ? current.code : positionId && area && rack ? trayCodeForPosition(positionId, area.name, rack.name) : "" };
                })}
                error={errors.positionId}
                disabled={!!tray || saving}
                excludeTrayId={tray?.id}
              />
              {tray && (
                <p className="subtle">
                  Dùng thao tác “Di chuyển khay” để thay đổi vị trí.
                </p>
              )}
            </div>
            <Field label="Ghi chú" htmlFor="tray-notes">
              <textarea
                id="tray-notes"
                maxLength={1000}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                className="min-h-24 w-full rounded-lg border p-3 text-sm"
              />
            </Field>
            <FormError message={errors.form} />
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={requestClose} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : tray ? "Lưu thay đổi" : "Tạo khay"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
        creating={!tray}
      />
    </>
  );
}
