"use client";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { vi } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Choice, FormError } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { useVarieties } from "@/components/varieties/varieties-provider";
import {
  currentAssignment,
  currentCycle,
  locationOf,
  normalize,
  remaining,
} from "@/lib/operations/selectors";
import { expectedHarvest, lifecycleOf } from "@/lib/operations/cycles";
import { date, dayKey } from "@/lib/formatters";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import { StaffReferenceSelect } from "@/components/staff/staff-reference-select";
import type { CultivationSupply } from "@/lib/api/staff/staff-cultivation-service";
import type { CycleDraft, PlantingCycle } from "@/lib/operations/types";

export function CycleForm({
  cycle,
  initialTray,
  onSaved,
  onDirtyChange,
}: {
  cycle?: PlantingCycle;
  initialTray?: string;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { state, orders, execute, reload } = useOperations();
  const { catalog } = useVarieties();
  const [supplies, setSupplies] = useState<CultivationSupply[]>([]);
  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (cycle) return;
    let active = true;
    staffCultivationService.supplies({ type: "SEED", active: true })
      .then((items) => { if (active) setSupplies(items); })
      .catch((reason) => { if (active) setErrors({ form: reason instanceof Error ? reason.message : "Không thể tải giống cây." }); });
    return () => { active = false; };
  }, [cycle]);
  const originalTray = state.trays.find(
    (t) => t.id === (cycle?.trayId ?? initialTray),
  );
  const loc = originalTray ? locationOf(state, originalTray) : undefined;
  const [area, setArea] = useState(loc?.area?.id ?? "");
  const [shelf, setShelf] = useState(loc?.shelf?.id ?? "");
  const [draft, setDraft] = useState<CycleDraft>({
    varietyId:
      cycle?.varietyId ??
      catalog.find((v) => normalize(v.name) === normalize(cycle?.seed ?? ""))
        ?.id ??
      "",
    trayId: originalTray?.id ?? "",
    itemId: originalTray
      ? (currentAssignment(state, originalTray.id)?.itemId ?? "")
      : "",
    sowed: cycle?.sowed ?? "",
    notes: cycle?.notes ?? "",
  });
  const [initial] = useState(() => JSON.stringify({ area, shelf, draft }));
  const dirty = JSON.stringify({ area, shelf, draft }) !== initial;
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  const [calendar, setCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => cycle?.sowed ? new Date(`${cycle.sowed}T12:00:00`) : new Date());
  const variety = catalog.find((v) => v.id === draft.varietyId);
  const selectedSupply = supplies.find((s) => String(s.supplyId) === draft.varietyId);
  const duration =
    cycle?.growthDays ??
    (cycle
      ? Math.max(
          1,
          Math.round(
            (Date.parse(cycle.harvest) - Date.parse(cycle.sowed)) / 86400000,
          ),
        )
      : selectedSupply?.harvestDays ?? variety?.referenceGrowthDays);
  const harvest = duration ? expectedHarvest(draft.sowed, duration) : "";
  const assignment = currentAssignment(state, draft.trayId);
  const eligible = state.trays.filter(
    (t) =>
      t.status === "Sẵn sàng" &&
      !currentCycle(state, t.id) &&
      locationOf(state, t).area?.status === "Hoạt động",
  );
  const trays = state.trays.filter(
    (t) =>
      (eligible.some((e) => e.id === t.id) ||
        t.id === cycle?.trayId ||
        (t.id === initialTray &&
          t.status === "Đã giữ chỗ" &&
          !!currentAssignment(state, t.id) &&
          !currentCycle(state, t.id))) &&
      locationOf(state, t).area?.id === area &&
      locationOf(state, t).shelf?.id === shelf,
  );
  const rentalItems = state.items.filter((i) => {
    if (i.id === assignment?.itemId) return true;
    const order = orders.find((o) => o.id === i.orderId);
    return (
      order?.kind === "rental" &&
      order.payment === "Đã xác nhận" &&
      !["Hoàn tất", "Đã hủy"].includes(order.status) &&
      remaining(state, i.id) > 0 &&
      (!variety || normalize(i.seed) === normalize(variety.name))
    );
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const invalid: Record<string, string> = {};
    if (!area) invalid.area = "Vui lòng chọn khu vực.";
    if (!shelf) invalid.shelf = "Vui lòng chọn tầng kệ.";
    if (!draft.varietyId || (!cycle && !selectedSupply)) invalid.varietyId = "Vui lòng chọn giống rau.";
    if (!draft.trayId || !trays.some((t) => t.id === draft.trayId))
      invalid.trayId = "Vui lòng chọn khay sẵn sàng tại vị trí này.";
    if (!draft.sowed) invalid.sowed = "Vui lòng chọn ngày gieo.";
    if (!cycle && (!orderId || !customerId)) invalid.itemId = "Vui lòng chọn đơn thuê hợp lệ.";
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      return;
    }
    if (!cycle) {
      setSaving(true);
      try {
        const order = await staffOrdersService.get(Number(orderId));
        if (order.customerId !== customerId || order.orderType !== "TRAY_RENTAL" || !["CONFIRMED", "PREPARING", "DELIVERING"].includes(order.status))
          throw new Error("Đơn thuê không còn hợp lệ để tạo chu kỳ.");
        if (order.rentals.some((rental) => rental.soilTrayId === Number(draft.trayId)))
          throw new Error("Khay này đã có chu kỳ trong đơn thuê.");
        await staffCultivationService.startCycle({
          customerId, soilTrayId: Number(draft.trayId), supplyId: Number(draft.varietyId),
          orderId: Number(orderId), startDate: new Date(`${draft.sowed}T00:00:00+07:00`).toISOString(),
        });
        await reload();
        onSaved();
      } catch (reason) {
        setErrors({ form: reason instanceof Error ? reason.message : "Không thể tạo chu kỳ." });
      } finally { setSaving(false); }
      return;
    }
    const result = await execute(
      { type: "cycle-save", id: cycle?.id, draft },
      cycle ? "Đã cập nhật chu kỳ." : "Đã tạo chu kỳ trồng.",
    );
    if (result.ok) onSaved();
    else setErrors({ [result.field]: result.message });
  }
  return (
    <form id="cycle-form" onSubmit={submit} noValidate className="space-y-5">
      {cycle && (
        <Field label="Mã chu kỳ" htmlFor="cycle-code">
          <Input id="cycle-code" value={cycle.id} readOnly />
        </Field>
      )}
      <Field label="Giống rau *" error={errors.varietyId}>
        <Choice
          label="Giống rau"
          value={draft.varietyId}
          disabled={!!cycle}
          onChange={(v) =>
            setDraft({
              ...draft,
              varietyId: v,
              itemId: assignment?.itemId ?? "",
            })
          }
          options={[
            { value: "", label: "Chọn giống rau" },
            ...(!cycle ? supplies.map((s) => ({ value: String(s.supplyId), label: s.supplyName })) : catalog
              .filter(
                (v) =>
                  v.enabledForNewRentals ||
                  v.id === draft.varietyId ||
                  !!assignment,
              )
              .map((v) => ({ value: v.id, label: v.name }))),
          ]}
        />
      </Field>
      <Field label="Khu vực *" error={errors.area}>
        <Choice
          label="Khu vực của chu kỳ"
          value={area}
          disabled={!!cycle}
          onChange={(v) => {
            setArea(v);
            setShelf("");
            setDraft({ ...draft, trayId: "", itemId: "" });
          }}
          options={[
            { value: "", label: "Chọn khu vực" },
            ...state.areas
              .filter((a) => a.status === "Hoạt động")
              .map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
      </Field>
      <Field label="Tầng kệ *" error={errors.shelf}>
        <Choice
          label="Tầng kệ của chu kỳ"
          value={shelf}
          disabled={!!cycle || !area}
          onChange={(v) => {
            setShelf(v);
            setDraft({ ...draft, trayId: "", itemId: "" });
          }}
          options={[
            { value: "", label: "Chọn tầng kệ" },
            ...(state.areas.find((a) => a.id === area)?.shelves ?? []).map(
              (s) => ({ value: s.id, label: s.name }),
            ),
          ]}
        />
      </Field>
      <Field label="Khay trồng *" error={errors.trayId}>
        <Choice
          label="Khay trồng"
          value={draft.trayId}
          disabled={!!cycle || !shelf}
          onChange={(v) => {
            const linked = currentAssignment(state, v);
            setDraft({ ...draft, trayId: v, itemId: linked?.itemId ?? "" });
          }}
          options={[
            { value: "", label: "Chọn khay" },
            ...trays.map((t) => ({ value: t.id, label: t.code })),
          ]}
        />
        {shelf && !trays.length && (
          <p className="text-xs text-muted-foreground">
            Không có khay sẵn sàng tại kệ này.
          </p>
        )}
      </Field>
      <Field label="Đơn thuê" error={errors.itemId}>
        {!cycle ? <StaffReferenceSelect kind="rentalOrder" label="Đơn thuê" value={orderId} disabled={saving}
          onChange={(value, option) => { setOrderId(value); setCustomerId(option?.customerId ?? null); }} /> :
        <Choice
          label="Đơn thuê của chu kỳ"
          value={draft.itemId}
          disabled={!!cycle || !!assignment}
          onChange={(v) => setDraft({ ...draft, itemId: v })}
          options={[
            { value: "", label: "Chọn đơn thuê" },
            ...rentalItems.map((i) => ({
              value: i.id,
              label: `${i.orderId} · ${orders.find((o) => o.id === i.orderId)?.customer ?? ""} · ${i.seed}`,
            })),
          ]}
        />}
      </Field>
      <Field label="Ngày gieo *" error={errors.sowed}>
        <Popover open={calendar} onOpenChange={(open) => { if (open) setCalendarMonth(draft.sowed ? new Date(`${draft.sowed}T12:00:00`) : new Date()); setCalendar(open); }}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label="Ngày gieo"
              disabled={!!cycle && lifecycleOf(cycle) !== "Chuẩn bị"}
              className="w-full justify-start text-left font-normal"
            >
              <CalendarDays className="size-4" />
              {draft.sowed ? date(draft.sowed) : "Chọn ngày gieo"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={vi}
              selected={
                draft.sowed ? new Date(draft.sowed + "T12:00:00") : undefined
              }
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelect={(v) => {
                if (v) setDraft({ ...draft, sowed: dayKey(v) });
                setCalendar(false);
              }}
            />
            <div className="border-t p-2"><Button type="button" variant="outline" size="sm" onClick={() => { const today = new Date(); setDraft({ ...draft, sowed: dayKey(today) }); setCalendarMonth(today); setCalendar(false); }}>Hôm nay</Button></div>
          </PopoverContent>
        </Popover>
      </Field>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-4">
        <div>
          <p className="text-xs text-muted-foreground">Thời gian sinh trưởng</p>
          <p className="mt-2 text-sm font-semibold">
            {duration ? `${duration} ngày` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Thu hoạch dự kiến</p>
          <p className="mt-2 text-sm font-semibold">
            {harvest ? date(harvest) : "—"}
          </p>
        </div>
      </div>
      <Field label="Ghi chú" htmlFor="cycle-notes">
        <textarea
          id="cycle-notes"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Nhập ghi chú cho chu kỳ..."
          className="w-full rounded-xl border p-3 text-sm"
          rows={4}
          maxLength={2000}
        />
      </Field>
      <FormError message={errors.form} />
    </form>
  );
}
