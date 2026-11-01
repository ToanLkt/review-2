"use client";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SummaryCard } from "@/components/admin/summary-card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Inbox } from "lucide-react";
export const statusStyles: Record<string, string> = {
  "Sẵn sàng": "!bg-[#E8F3EB] !text-[#3F7655]",
  "Đã giữ chỗ": "!bg-blue-50 !text-blue-700",
  "Đang trồng": "!bg-primary !text-white",
  "Chờ vệ sinh": "!bg-amber-50 !text-amber-800",
  "Bảo trì": "!bg-slate-100 !text-slate-600",
  "Hoạt động": "!bg-[#E8F3EB] !text-[#3F7655]",
  "Ngừng sử dụng": "!bg-slate-100 !text-slate-600",
  Trống: "!bg-white !text-muted-foreground",
};
export function PhysicalStatus({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`border-transparent text-[10px] font-medium ${statusStyles[status] ?? "!bg-muted !text-foreground"}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {status}
    </Badge>
  );
}
export function Choice({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value || "_"}
      onValueChange={(v) => onChange(v === "_" ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        className="h-9 w-full min-w-0 bg-white text-xs"
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value || "_"} value={o.value || "_"}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
export function FormError({ message }: { message?: string }) {
  return message ? (
    <p
      role="alert"
      className="rounded-lg border border-destructive/20 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
    >
      {message}
    </p>
  ) : null;
}
export function EmptyState({
  title = "Không có kết quả phù hợp",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="rounded-2xl bg-muted p-4">
        <Inbox className="size-6 text-primary" />
      </span>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
export function SummaryCards({
  items,
  label = "Toàn nông trại",
  catalogStyle = false,
}: {
  items: {
    label: string;
    value: number | string;
    icon: ReactNode;
    detail?: string;
    color?: string;
  }[];
  label?: string;
  catalogStyle?: boolean;
}) {
  return (
    <section aria-label="Tổng hợp">
      <p className="mb-2 text-[10px] text-muted-foreground">{label}</p>
      <div
        className={
          catalogStyle
            ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
            : "grid grid-cols-2 gap-3 xl:grid-cols-4"
        }
      >
        {items.map((i) =>
          catalogStyle ? (
            <SummaryCard
              key={i.label}
              value={i.value}
              label={i.label}
              support={i.detail ?? label}
              color={i.color}
            />
          ) : (
            <Card key={i.label} className="section-card">
              <div className="p-4 lg:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{i.label}</p>
                  <span className="rounded-lg bg-secondary/60 p-2 text-primary">
                    {i.icon}
                  </span>
                </div>
                <p className="text-2xl font-semibold tracking-tight">
                  {i.value}
                </p>
                {i.detail && <p className="subtle mt-1">{i.detail}</p>}
              </div>
            </Card>
          ),
        )}
      </div>
    </section>
  );
}
