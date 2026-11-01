"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-[#E2E8E4] bg-white shadow-[0_1px_4px_rgba(36,74,48,0.05)]",
        className,
      )}
    >
      <header className="border-b border-[#E2E8E4] px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-[#1F2937]">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#6B7280]">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export function SettingsField({
  label,
  htmlFor,
  helper,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[#27322B]"
      >
        {label}
      </label>
      {children}
      {helper && !error && (
        <p className="text-xs leading-5 text-[#6B7280]">{helper}</p>
      )}
      {error && (
        <p role="alert" className="text-xs leading-5 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function SettingsSelect({
  id,
  label,
  value,
  onValueChange,
  options,
}: {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className="h-11 w-full rounded-xl border-[#E2E8E4] bg-white shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ToggleRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  badge,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-[#E8EEE9] py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={id} className="cursor-pointer text-sm font-medium text-[#1F2937]">
            {title}
          </label>
          {badge && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-[#6B7280]">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={`${title}: ${checked ? "đang bật" : "đang tắt"}`}
      />
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <SettingsField label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="h-11 rounded-xl border-[#E2E8E4] pr-11 shadow-none"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7F9686] hover:bg-[#F3F8F4] hover:text-[#3F7655] focus-visible:outline-2 focus-visible:outline-[#4F8F68]"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </SettingsField>
  );
}

export const settingsInputClass =
  "h-11 rounded-xl border-[#E2E8E4] bg-white shadow-none";
