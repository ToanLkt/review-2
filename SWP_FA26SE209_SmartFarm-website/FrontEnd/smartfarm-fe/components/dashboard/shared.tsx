"use client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function FilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={className ?? "h-9 bg-white text-xs"}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Status({ children }: { children: string }) {
  const tone = /hủy|hoàn tiền|Cần kiểm tra|mất kết nối/.test(children)
    ? "status-red"
    : /Chờ|Ươm|Chưa|Đang xử lý/.test(children)
      ? "status-amber"
      : "status-green";
  return (
    <Badge
      className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${tone}`}
    >
      {children}
    </Badge>
  );
}
export function Pagination({
  page,
  total,
  size,
  onChange,
}: {
  page: number;
  total: number;
  size: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex items-center justify-between border-t px-5 py-3">
      <p className="subtle">
        {total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)} trong{" "}
        {total} kết quả
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-3" />
        </Button>
        <span className="text-xs">
          {page} / {pages}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          aria-label="Trang sau"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="size-3" />
        </Button>
      </div>
    </div>
  );
}
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b py-3">
      <dt className="subtle mb-1">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}
