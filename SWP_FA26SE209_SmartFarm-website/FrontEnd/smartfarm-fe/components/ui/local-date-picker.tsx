"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { vi } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { date, dayKey } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function LocalDatePicker({ value, onChange, label, min, max, className, allowClear = false }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  max?: string;
  className?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  const [month, setMonth] = useState(() => selected ?? new Date());
  const today = new Date();
  const todayKey = dayKey(today);
  const todayDisabled = (!!min && todayKey < min) || (!!max && todayKey > max);
  return <Popover open={open} onOpenChange={(next) => { if (next) setMonth(selected ?? new Date()); setOpen(next); }}>
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" aria-label={label} className={cn("justify-between font-normal", className)}>
        <span>{value ? date(value) : "dd/mm/yyyy"}</span><CalendarDays className="size-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-auto max-w-[calc(100vw-24px)] p-0">
      <Calendar mode="single" locale={vi} selected={selected} month={month} onMonthChange={setMonth}
        disabled={(day) => { const key = dayKey(day); return (!!min && key < min) || (!!max && key > max); }}
        onSelect={(day) => { if (day) { onChange(dayKey(day)); setOpen(false); } }} />
      <div className="flex items-center justify-between gap-2 border-t p-2">
        <Button type="button" variant="outline" size="sm" disabled={todayDisabled} onClick={() => { onChange(dayKey(new Date())); setOpen(false); }}>Hôm nay</Button>
        {allowClear && value && <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(""); setOpen(false); }}>Xóa ngày đã chọn</Button>}
      </div>
    </PopoverContent>
  </Popover>;
}
