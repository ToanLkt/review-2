"use client";
import { useState } from "react";
import { DiscardDialog } from "../shared/discard-dialog";
import { Plus, Trash2, Layers3 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "../shared/ui";
import { readAreaCreation, useOperations } from "../shared/operations-provider";
import { normalizeZoneName, suggestRackCode, zoneNameSuffix } from "@/lib/operations/farm-workflow";
import type { GrowingArea, AreaDraft } from "@/lib/operations/types";
export function AreaFormSheet({
  area,
  onClose,
}: {
  area?: GrowingArea;
  onClose: () => void;
}) {
  const { execute, state } = useOperations();
  const [draft, setDraft] = useState<AreaDraft>(() =>
    area
      ? structuredClone(area)
      : {
          code: "AUTO",
          name: "",
          location: "",
          description: "",
          shelves: [
            { id: "S-1", name: suggestRackCode("", 0), levels: 2, positionsPerLevel: 4 },
          ],
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initial] = useState(() => JSON.stringify(draft));
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const existingRackIds = new Set(area?.shelves.map((shelf) => shelf.id) ?? []);
  const rackCodesInUse = state.areas.flatMap((item) => item.shelves.map((shelf) => shelf.name));
  function generateRackCodes(shelves: AreaDraft["shelves"], name: string) {
    const used = [...rackCodesInUse, ...shelves.filter((shelf) => existingRackIds.has(shelf.id)).map((shelf) => shelf.name)];
    const pending = !area ? readAreaCreation() : null;
    const savedCodes = pending && normalizeZoneName(pending.zoneName) === normalizeZoneName(name)
      ? pending.racks.map((rack) => rack.code) : [];
    return shelves.map((shelf, index) => {
      if (existingRackIds.has(shelf.id)) return shelf;
      const code = savedCodes[index] ?? suggestRackCode(normalizeZoneName(name), index, used);
      used.push(code);
      return { ...shelf, name: code };
    });
  }
  function requestClose() {
    if (saving) return;
    if (JSON.stringify(draft) !== initial) setDiscard(true);
    else onClose();
  }
  const capacity = draft.shelves.reduce(
    (n, s) =>
      n +
      (Number.isFinite(s.levels * s.positionsPerLevel)
        ? s.levels * s.positionsPerLevel
        : 0),
    0,
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const result = await execute(
        { type: "area-save", id: area?.id, draft },
        "Đã " + (area ? "cập nhật" : "tạo") + " khu vực.",
      );
      if (result.ok) onClose();
      else setErrors({ [result.field]: result.message });
    } finally { setSaving(false); }
  }
  return (
    <>
      <Sheet open onOpenChange={(o) => !o && requestClose()}>
        <SheetContent className="overflow-y-auto sm:!max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              {area ? "Chỉnh sửa khu vực" : "Thêm khu vực"}
            </SheetTitle>
            <SheetDescription>
              Thiết lập không gian và sức chứa theo cấu hình kệ.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} noValidate className="space-y-5 px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên khu vực" htmlFor="area-name" error={errors.name}>
                <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
                  <span className="shrink-0 border-r px-3 text-sm font-medium">Khu</span>
                  <Input
                    id="area-name"
                    className="border-0 shadow-none focus-visible:ring-0"
                    value={zoneNameSuffix(draft.name)}
                    maxLength={96}
                    disabled={saving}
                    onChange={(e) => {
                      const suffix = /^khu(?:[\s-]+|$)/i.test(e.target.value)
                        ? zoneNameSuffix(e.target.value) : e.target.value;
                      const name = `Khu ${suffix}`;
                      setDraft((current) => ({ ...current, name, shelves: generateRackCodes(current.shelves, name) }));
                    }}
                    placeholder="VD: A"
                    aria-invalid={!!errors.name}
                  />
                </div>
              </Field>
              <Field label="Vị trí" htmlFor="area-location" error={errors.location}>
                <Input
                  id="area-location"
                  value={draft.location}
                  maxLength={255}
                  disabled={saving}
                  onChange={(e) => setDraft((current) => ({ ...current, location: e.target.value }))}
                  placeholder="VD: Tầng 3, phía đông"
                  aria-invalid={!!errors.location}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">Nhập phần tên sau chữ Khu. Mã kệ được tạo tự động và không chỉnh sửa thủ công.</p>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Cấu hình kệ</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving || draft.shelves.length >= 20}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    shelves: generateRackCodes([...current.shelves, {
                      id: "S-" + crypto.randomUUID(), name: "", levels: 2, positionsPerLevel: 4,
                    }], current.name),
                  }))}
                >
                  <Plus />
                  Thêm kệ
                </Button>
              </div>
              <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                {draft.shelves.map((s, i) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_72px_85px_30px] items-end gap-2 rounded-xl bg-muted p-3"
                  >
                    <Field label="Mã kệ" htmlFor={"shelf-name-" + i}>
                      <Input
                        id={"shelf-name-" + i}
                        value={s.name}
                        readOnly
                        aria-readonly="true"
                      />
                    </Field>
                    {(["levels", "positionsPerLevel"] as const).map((key) => (
                      <Field
                        key={key}
                        label={key === "levels" ? "Số tầng" : "Vị trí/tầng"}
                        htmlFor={key + i}
                      >
                        <Input
                          id={key + i}
                          type="number"
                          min={1}
                          max={key === "levels" ? 10 : 20}
                          disabled={saving}
                          value={Number.isNaN(s[key]) ? "" : s[key]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              shelves: draft.shelves.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      [key]:
                                        e.target.value === ""
                                          ? NaN
                                          : Number(e.target.value),
                                    }
                                  : x,
                              ),
                            })
                          }
                        />
                      </Field>
                    ))}
                    <Button
                      variant="ghost"
                          size="icon"
                          type="button"
                      aria-label={"Xóa " + s.name}
                      disabled={saving || draft.shelves.length === 1}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          shelves: draft.shelves.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <FormError message={errors.shelves} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-secondary/50 p-4">
              <span className="flex items-center gap-2 text-xs text-primary">
                <Layers3 className="size-4" />
                Tổng sức chứa
              </span>
              <strong>{capacity} vị trí khay</strong>
            </div>
            <FormError message={errors.form} />
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={requestClose} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : area ? "Lưu thay đổi" : "Tạo khu vực"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
        creating={!area}
      />
    </>
  );
}
