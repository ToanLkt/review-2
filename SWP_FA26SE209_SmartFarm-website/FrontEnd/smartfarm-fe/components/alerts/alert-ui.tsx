"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Search,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  formatAlertDate,
  severityLabel,
  statusLabel,
  type AlertFilters,
  type AlertSeverity,
  type AlertStatus,
  type SmartAlert,
} from "@/lib/alerts";

const severityStyles: Record<
  AlertSeverity,
  { icon: LucideIcon; box: string; badge: string }
> = {
  CRITICAL: {
    icon: WifiOff,
    box: "bg-red-50 text-red-600",
    badge: "border-red-100 bg-red-50 text-red-700",
  },
  WARNING: {
    icon: TriangleAlert,
    box: "bg-amber-50 text-amber-600",
    badge: "border-amber-100 bg-amber-50 text-amber-700",
  },
  INFO: {
    icon: Info,
    box: "bg-blue-50 text-blue-600",
    badge: "border-blue-100 bg-blue-50 text-blue-700",
  },
};

const statusStyles: Record<AlertStatus, string> = {
  UNRESOLVED: "border-red-100 bg-red-50 text-red-700",
  IN_PROGRESS: "border-amber-100 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

export function SeverityIcon({
  severity,
  className,
}: {
  severity: AlertSeverity;
  className?: string;
}) {
  const style = severityStyles[severity];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        style.box,
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const Icon = severityStyles[severity].icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        severityStyles[severity].badge,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {severityLabel[severity]}
    </Badge>
  );
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const Icon =
    status === "RESOLVED"
      ? CheckCircle2
      : status === "IN_PROGRESS"
        ? Clock3
        : AlertCircle;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        statusStyles[status],
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {statusLabel[status]}
    </Badge>
  );
}

export function AlertSummary({
  unresolved,
  inProgress,
  resolvedToday,
  averageMinutes,
}: {
  unresolved: number;
  inProgress: number;
  resolvedToday: number;
  averageMinutes: number;
}) {
  const cards = [
    {
      label: "Chưa xử lý",
      value: unresolved,
      detail: "Cần xử lý ngay",
      icon: AlertCircle,
      box: "bg-red-50 text-red-600",
      detailClass: "text-red-600",
    },
    {
      label: "Đang xử lý",
      value: inProgress,
      detail: "Đã giao cho nhân viên",
      icon: Clock3,
      box: "bg-amber-50 text-amber-600",
      detailClass: "text-amber-600",
    },
    {
      label: "Đã giải quyết hôm nay",
      value: resolvedToday,
      detail: `Trung bình ${averageMinutes} phút/sự cố`,
      icon: CheckCircle2,
      box: "bg-emerald-50 text-emerald-600",
      detailClass: "text-emerald-600",
    },
  ];

  return (
    <section
      aria-label="Tổng hợp cảnh báo"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="min-w-0 rounded-2xl border border-[#E2E8E4] bg-white px-6 py-6 shadow-[0_1px_3px_rgba(36,74,48,0.03)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[30px] font-bold leading-tight tracking-tight tabular-nums text-[#1F2937]">
                  {card.value}
                </p>
                <h2 className="mt-2 text-sm font-medium text-[#6B7280]">
                  {card.label}
                </h2>
                <p className={cn("mt-2 text-xs font-medium", card.detailClass)}>
                  {card.detail}
                </p>
              </div>
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  card.box,
                )}
                aria-hidden="true"
              >
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-11 w-full rounded-xl border-[#E2E8E4] bg-white shadow-none",
          className,
        )}
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

export function AlertFilterBar({
  filters,
  showStatus,
  onChange,
}: {
  filters: AlertFilters;
  showStatus: boolean;
  onChange: (next: AlertFilters) => void;
}) {
  const patch = <K extends keyof AlertFilters>(
    key: K,
    value: AlertFilters[K],
  ) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-3 border-b border-[#E2E8E4] px-5 py-5 lg:px-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(140px,1fr))]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7FA08A]"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(event) => patch("search", event.target.value)}
            placeholder="Tìm kiếm cảnh báo..."
            aria-label="Tìm kiếm cảnh báo"
            className="h-11 rounded-xl border-[#E2E8E4] bg-white pl-10 shadow-none"
          />
        </div>
        <FilterSelect
          label="Lọc theo mức độ"
          value={filters.severity}
          onValueChange={(value) =>
            patch("severity", value as AlertFilters["severity"])
          }
          options={[
            { value: "ALL", label: "Tất cả mức độ" },
            { value: "CRITICAL", label: "Nghiêm trọng" },
            { value: "WARNING", label: "Cảnh báo" },
            { value: "INFO", label: "Thông tin" },
          ]}
        />
        <FilterSelect
          label="Lọc theo khu vực"
          value={filters.area}
          onValueChange={(value) => patch("area", value as AlertFilters["area"])}
          options={[
            { value: "ALL", label: "Tất cả khu vực" },
            { value: "Khu A", label: "Khu A" },
            { value: "Khu B", label: "Khu B" },
            { value: "Khu C", label: "Khu C" },
          ]}
        />
        <FilterSelect
          label="Lọc theo loại cảnh báo"
          value={filters.category}
          onValueChange={(value) =>
            patch("category", value as AlertFilters["category"])
          }
          options={[
            { value: "ALL", label: "Tất cả loại" },
            ...Object.entries(categoryLabel).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <FilterSelect
          label="Lọc theo thời gian"
          value={filters.date}
          onValueChange={(value) =>
            patch("date", value as AlertFilters["date"])
          }
          options={[
            { value: "today", label: "Hôm nay" },
            { value: "7days", label: "7 ngày qua" },
            { value: "30days", label: "30 ngày qua" },
            { value: "custom", label: "Khoảng tùy chỉnh" },
          ]}
        />
      </div>
      {(showStatus || filters.date === "custom") && (
        <div className="flex flex-wrap gap-3">
          {showStatus && (
            <FilterSelect
              label="Lọc theo trạng thái"
              value={filters.status}
              onValueChange={(value) =>
                patch("status", value as AlertFilters["status"])
              }
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "UNRESOLVED", label: "Chưa xử lý" },
                { value: "IN_PROGRESS", label: "Đang xử lý" },
                { value: "RESOLVED", label: "Đã giải quyết" },
              ]}
              className="w-48"
            />
          )}
          {filters.date === "custom" && (
            <>
              <Input
                type="date"
                value={filters.from ?? ""}
                onChange={(event) => patch("from", event.target.value)}
                aria-label="Ngày bắt đầu"
                className="h-11 w-44 rounded-xl border-[#E2E8E4] shadow-none"
              />
              <Input
                type="date"
                value={filters.to ?? ""}
                onChange={(event) => patch("to", event.target.value)}
                aria-label="Ngày kết thúc"
                className="h-11 w-44 rounded-xl border-[#E2E8E4] shadow-none"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AlertList({
  alerts,
  total,
  page,
  pageSize,
  onPageChange,
  onOpen,
  onClear,
}: {
  alerts: SmartAlert[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onOpen: (alert: SmartAlert) => void;
  onClear: () => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (!alerts.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F8F4] text-[#4F8F68]">
          <ShieldCheck className="size-7" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold text-[#1F2937]">
          Không tìm thấy cảnh báo
        </h3>
        <p className="text-sm text-[#6B7280]">
          Không có cảnh báo nào phù hợp với bộ lọc hiện tại.
        </p>
        <Button variant="outline" className="mt-1" onClick={onClear}>
          Xóa bộ lọc
        </Button>
      </div>
    );
  }

  return (
    <>
      <div role="list" aria-label="Danh sách cảnh báo">
        {alerts.map((alert) => (
          <div key={alert.id} role="listitem" className="border-b border-[#E2E8E4] last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(alert)}
              className="group grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-4 px-5 py-5 text-left transition-colors hover:bg-[#F7FAF8] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4F8F68] md:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-6"
            >
              <SeverityIcon severity={alert.severity} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#1F2937] group-hover:text-[#3F7655]">
                    {alert.title}
                  </span>
                  <SeverityBadge severity={alert.severity} />
                </span>
                <span className="mt-1.5 block text-sm text-[#6B7280]">
                  {alert.location}
                </span>
                {alert.value && (
                  <span className="mt-1 block text-xs font-medium text-[#52635A]">
                    Giá trị: {alert.value}
                    {alert.threshold ? ` (Ngưỡng: ${alert.threshold})` : ""}
                  </span>
                )}
                {alert.assignedTo && (
                  <span className="mt-1 block text-xs text-[#73917D]">
                    Phân công: {alert.assignedTo}
                  </span>
                )}
              </span>
              <span className="col-span-2 flex min-w-0 items-center justify-between gap-3 pl-[60px] md:col-span-1 md:flex-col md:items-end md:justify-center md:pl-0">
                <AlertStatusBadge status={alert.status} />
                <span className="whitespace-nowrap text-xs tabular-nums text-[#6B7280]">
                  {formatAlertDate(alert.detectedAt)}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8E4] px-5 py-4 text-sm text-[#6B7280] lg:px-6">
        <p className="tabular-nums">
          Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} trong {total} cảnh báo
        </p>
        <nav aria-label="Phân trang cảnh báo" className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Trang trước"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: pages }, (_, index) => index + 1).map(
            (number) => (
              <Button
                key={number}
                type="button"
                variant={number === page ? "default" : "ghost"}
                size="icon"
                className="size-9 rounded-lg"
                aria-label={`Trang ${number}`}
                aria-current={number === page ? "page" : undefined}
                onClick={() => onPageChange(number)}
              >
                {number}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Trang sau"
            disabled={page === pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </footer>
    </>
  );
}
