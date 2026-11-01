"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventory } from "./inventory-provider";
import {
  groups,
  exportReasons,
  performers,
  fmtQty,
  validateMaterial,
  type Material,
  type MaterialDraft,
  type MaterialErrors,
  type ImportExportErrors,
} from "@/lib/inventory";

// ---------------------------------------------------------------------------
// Shared: mini stock stat cards shown inside drawers
// ---------------------------------------------------------------------------
function StockStats({ material }: { material: Material }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { value: fmtQty(material.stock), label: "Tồn kho", color: "" },
        {
          value: fmtQty(material.reserved),
          label: "Đã giữ",
          color: "text-blue-600",
        },
        {
          value: fmtQty(material.available),
          label: "Khả dụng",
          color: "text-primary",
        },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border p-3 text-center">
          <p className={"text-base font-bold tabular-nums " + s.color}>
            {s.value} {material.unit}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import drawer
// ---------------------------------------------------------------------------
export function ImportDrawer({
  onClose,
  returnFocus,
}: {
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { materials, importStock } = useInventory();
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [txDate, setTxDate] = useState("2026-09-09");
  const [supplier, setSupplier] = useState("");
  const [performer, setPerformer] = useState(performers[0]);
  const [errors, setErrors] = useState<ImportExportErrors>({});

  const selected = materials.find((m) => m.id === materialId);

  function submit() {
    const result = importStock(materialId, quantity, txDate, supplier, performer);
    setErrors(result);
    if (!Object.keys(result).length) onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="h-dvh gap-0 overflow-hidden! bg-white"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-6 pr-12">
          <SheetTitle>Nhập kho</SheetTitle>
          <SheetDescription>
            Ghi nhận nhập kho vật tư từ nhà cung cấp.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {/* Material select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Vật tư <span className="text-destructive">*</span>
            </label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.materialId && (
              <p role="alert" className="text-xs text-destructive">
                {errors.materialId}
              </p>
            )}
          </div>

          {/* Stock stats */}
          {selected && <StockStats material={selected} />}

          {/* Quantity + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="import-qty" className="text-sm font-medium">
                Số lượng <span className="text-destructive">*</span>
              </label>
              <Input
                id="import-qty"
                type="number"
                min={0}
                step="any"
                aria-invalid={!!errors.quantity}
                value={quantity || ""}
                onChange={(e) =>
                  setQuantity(
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
                placeholder="0"
              />
              {errors.quantity && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.quantity}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="import-date" className="text-sm font-medium">
                Ngày giao dịch
              </label>
              <Input
                id="import-date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
              {errors.date && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-1.5">
            <label htmlFor="import-supplier" className="text-sm font-medium">
              Nhà cung cấp
            </label>
            <Input
              id="import-supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="VD: Cty Hạt Giống Vàng"
            />
          </div>

          {/* Performer */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Người thực hiện</label>
            <Select value={performer} onValueChange={setPerformer}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {performers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errors.form && (
            <p role="alert" className="text-xs text-destructive">
              {errors.form}
            </p>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit}>Xác nhận nhập kho</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Export drawer
// ---------------------------------------------------------------------------
export function ExportDrawer({
  onClose,
  returnFocus,
}: {
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { materials, exportStock } = useInventory();
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [txDate, setTxDate] = useState("2026-09-09");
  const [reason, setReason] = useState(exportReasons[0]);
  const [performer, setPerformer] = useState(performers[0]);
  const [errors, setErrors] = useState<ImportExportErrors>({});

  const selected = materials.find((m) => m.id === materialId);

  function submit() {
    const result = exportStock(
      materialId,
      quantity,
      txDate,
      reason,
      performer,
    );
    setErrors(result);
    if (!Object.keys(result).length) onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="h-dvh gap-0 overflow-hidden! bg-white"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-6 pr-12">
          <SheetTitle>Xuất kho</SheetTitle>
          <SheetDescription>
            Ghi nhận xuất dùng vật tư cho nông trại.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {/* Material select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Vật tư <span className="text-destructive">*</span>
            </label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.materialId && (
              <p role="alert" className="text-xs text-destructive">
                {errors.materialId}
              </p>
            )}
          </div>

          {/* Stock stats */}
          {selected && <StockStats material={selected} />}

          {/* Quantity + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="export-qty" className="text-sm font-medium">
                Số lượng <span className="text-destructive">*</span>
              </label>
              <Input
                id="export-qty"
                type="number"
                min={0}
                step="any"
                aria-invalid={!!errors.quantity}
                value={quantity || ""}
                onChange={(e) =>
                  setQuantity(
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
                placeholder="0"
              />
              {errors.quantity && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.quantity}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="export-date" className="text-sm font-medium">
                Ngày giao dịch
              </label>
              <Input
                id="export-date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
              {errors.date && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Lý do xuất dùng (nội bộ nông trại)
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info notice */}
          <div className="flex gap-3 rounded-xl border border-primary/10 bg-secondary/25 p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Bán lẻ hạt giống được trừ kho tự động một lần khi bàn giao —
              không ghi nhận thủ công tại đây. Khay trồng là tài sản tái sử
              dụng, không phải vật tư tiêu hao.
            </p>
          </div>

          {/* Performer */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Người thực hiện</label>
            <Select value={performer} onValueChange={setPerformer}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {performers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errors.form && (
            <p role="alert" className="text-xs text-destructive">
              {errors.form}
            </p>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit}>Xác nhận xuất kho</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Update material drawer
// ---------------------------------------------------------------------------
export function UpdateDrawer({
  material,
  onClose,
  returnFocus,
}: {
  material: Material;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { updateMaterial } = useInventory();
  const [draft, setDraft] = useState<MaterialDraft>({
    name: material.name,
    group: material.group,
    unit: material.unit,
    minThreshold: material.minThreshold,
    note: material.note,
  });
  const [errors, setErrors] = useState<MaterialErrors>({});

  function submit() {
    const result = validateMaterial(draft);
    setErrors(result);
    if (Object.keys(result).length) return;
    const saveResult = updateMaterial(material.id, draft);
    setErrors(saveResult);
    if (!Object.keys(saveResult).length) onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="h-dvh gap-0 overflow-hidden! bg-white"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-6 pr-12">
          <SheetTitle>Cập nhật vật tư</SheetTitle>
          <SheetDescription>
            Chỉnh sửa thông tin vật tư. Tồn kho chỉ thay đổi qua nhập/xuất.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {/* Current stock info (read-only) */}
          <div className="rounded-xl border bg-[#F7FAF8] p-4">
            <p className="text-base font-semibold">{material.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {material.code} · {material.group}
            </p>
          </div>
          <StockStats material={material} />

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="upd-name" className="text-sm font-medium">
              Tên vật tư
            </label>
            <Input
              id="upd-name"
              aria-invalid={!!errors.name}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            {errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Group */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nhóm</label>
            <Select
              value={draft.group}
              onValueChange={(v) => setDraft({ ...draft, group: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.group && (
              <p role="alert" className="text-xs text-destructive">
                {errors.group}
              </p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <label htmlFor="upd-unit" className="text-sm font-medium">
              Đơn vị
            </label>
            <Input
              id="upd-unit"
              aria-invalid={!!errors.unit}
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            />
            {errors.unit && (
              <p role="alert" className="text-xs text-destructive">
                {errors.unit}
              </p>
            )}
          </div>

          {/* Minimum threshold */}
          <div className="space-y-1.5">
            <label htmlFor="upd-threshold" className="text-sm font-medium">
              Ngưỡng tối thiểu
            </label>
            <Input
              id="upd-threshold"
              type="number"
              min={0}
              step="any"
              aria-invalid={!!errors.minThreshold}
              value={
                Number.isNaN(draft.minThreshold) ? "" : draft.minThreshold
              }
              onChange={(e) =>
                setDraft({
                  ...draft,
                  minThreshold:
                    e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
            />
            {errors.minThreshold && (
              <p role="alert" className="text-xs text-destructive">
                {errors.minThreshold}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label htmlFor="upd-note" className="text-sm font-medium">
              Ghi chú
            </label>
            <Textarea
              id="upd-note"
              rows={3}
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              placeholder="Ghi chú về vật tư..."
              className="resize-none"
            />
          </div>

          {errors.form && (
            <p role="alert" className="text-xs text-destructive">
              {errors.form}
            </p>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit}>Lưu thay đổi</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
