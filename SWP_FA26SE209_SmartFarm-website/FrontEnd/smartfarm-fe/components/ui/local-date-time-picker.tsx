"use client";

import { Input } from "@/components/ui/input";
import { LocalDatePicker } from "@/components/ui/local-date-picker";

export function LocalDateTimePicker({ value, onChange, label }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const day = value.slice(0, 10);
  const time = value.slice(11, 16) || "08:00";
  return <div className="flex flex-wrap gap-2">
    <LocalDatePicker label={`${label}: ngày`} value={day} allowClear onChange={(next) => onChange(next ? `${next}T${time}` : "")} className="min-w-40 flex-1" />
    <Input aria-label={`${label}: giờ`} type="time" disabled={!day} value={time}
      onChange={(event) => { if (day) onChange(`${day}T${event.target.value}`); }} className="w-28" />
  </div>;
}
