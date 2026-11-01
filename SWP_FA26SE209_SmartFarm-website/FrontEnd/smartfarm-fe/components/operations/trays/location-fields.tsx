"use client";
import { useEffect, useState } from "react";
import { useOperations } from "../shared/operations-provider";
import { Choice, Field } from "../shared/ui";
import { allPositions, vacantPositions } from "@/lib/operations/selectors";
export function LocationFields({
  value,
  onChange,
  error,
  disabled = false,
  excludeTrayId,
  onDirtyChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  excludeTrayId?: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { state } = useOperations();
  const initial = allPositions(state).find((p) => p.id === value);
  const [areaId, setArea] = useState(initial?.areaId ?? "");
  const [shelfId, setShelf] = useState(initial?.shelfId ?? "");
  const [level, setLevel] = useState(initial ? String(initial.level) : "");
  const [initialLocation] = useState(() =>
    JSON.stringify([areaId, shelfId, level, value]),
  );
  const dirty =
    JSON.stringify([areaId, shelfId, level, value]) !== initialLocation;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const area = state.areas.find((a) => a.id === areaId);
  const shelf = area?.shelves.find((s) => s.id === shelfId);
  const vacant = vacantPositions(state, excludeTrayId);
  const options = vacant.filter(
    (p) =>
      p.areaId === areaId && p.shelfId === shelfId && String(p.level) === level,
  );
  const tierCapacity = shelf?.positionsPerLevel ?? 0;
  const tierUsed = level && shelf ? tierCapacity - options.length : 0;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Khu vực">
          <Choice
            label="Khu vực khay"
            value={areaId}
            disabled={disabled}
            onChange={(v) => {
              setArea(v);
              setShelf("");
              setLevel("");
              onChange(null);
            }}
            options={[
              { value: "", label: "Chưa bố trí" },
              ...state.areas
                .filter((a) => a.status === "Hoạt động" || a.id === areaId)
                .map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        </Field>
        <Field label="Kệ">
          <Choice
            label="Kệ của khay"
            value={shelfId}
            disabled={disabled || !areaId}
            onChange={(v) => {
              setShelf(v);
              setLevel("");
              onChange(null);
            }}
            options={[
              { value: "", label: "Chọn kệ" },
              ...(area?.shelves ?? []).map((s) => ({
                value: s.id,
                label: s.name,
              })),
            ]}
          />
        </Field>
        <Field label="Tầng">
          <Choice
            label="Tầng của khay"
            value={level}
            disabled={disabled || !shelfId}
            onChange={(v) => {
              setLevel(v);
              onChange(null);
            }}
            options={[
              { value: "", label: "Chọn tầng" },
              ...Array.from({ length: shelf?.levels ?? 0 }, (_, i) => ({
                value: String(i + 1),
                label: "Tầng " + (i + 1),
              })),
            ]}
          />
        </Field>
        <Field label="Vị trí">
          <Choice
            label="Vị trí khay"
            value={value ?? ""}
            disabled={disabled || !level || options.length === 0}
            onChange={(v) => onChange(v || null)}
            options={[
              {
                value: "",
                label: !level ? "Chọn tầng trước" : options.length ? "Chọn vị trí trống" : "Tầng đã đầy",
              },
              ...options.map((p) => ({
                value: p.id,
                label: "Vị trí " + p.slot,
              })),
            ]}
          />
        </Field>
      </div>
      {level && shelf && !disabled && (
        <p className={`text-xs ${options.length ? "text-muted-foreground" : "text-amber-700"}`}>
          Tầng {level}: {tierUsed}/{tierCapacity} vị trí đã có khay.
          {!options.length && " Hãy chọn tầng hoặc kệ còn chỗ."}
        </p>
      )}
      {areaId && !value && !disabled && options.length > 0 && (
        <p className="text-xs text-amber-700">
          Chọn vị trí trống để tạo khay.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <input type="hidden" name="locationArea" value={areaId} />
    </div>
  );
}
