"use client";
import { Pencil, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Variety } from "@/lib/varieties";
export function VarietyDetail({
  variety,
  onEdit,
  onToggleAvailability,
}: {
  variety: Variety;
  onEdit: () => void;
  onToggleAvailability: () => void;
}) {
  const enabled = variety.enabledForNewRentals;
  return (
    <div className="space-y-7">
      <section className="flex items-center gap-5 rounded-2xl bg-[#F7FAF8] p-5 sm:p-6">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-[22px] bg-[#E8F3EB] text-primary">
          <Sprout className="size-8" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate text-xl font-bold">{variety.name}</h3>
          <p className="text-base font-medium text-muted-foreground">
            {variety.code}
          </p>
          <Badge
            variant="outline"
            className={
              enabled
                ? "border-0 bg-[#EDFAF1] px-3 py-1 text-sm font-semibold text-emerald-700"
                : "border-0 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600"
            }
          >
            {enabled
              ? "Cho phép chọn khi thuê mới"
              : "Đã tắt chọn khi thuê mới"}
          </Badge>
        </div>
      </section>
      <section
        aria-label="Thông số giống rau"
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl bg-[#F7FAF8] px-3 py-5 text-center">
          <p className="text-xl font-bold tabular-nums">
            {variety.referenceGrowthDays} ngày
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#8BAA97]">
            TG sinh trưởng tham khảo
          </p>
        </div>
        <div className="rounded-2xl bg-[#F7FAF8] px-3 py-5 text-center">
          <p
            className={
              enabled
                ? "text-xl font-bold text-primary"
                : "text-xl font-bold text-muted-foreground"
            }
          >
            {enabled ? "Bật" : "Tắt"}
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#8BAA97]">
            Chọn khi thuê mới
          </p>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-[#8BAA97] uppercase">
          Mô tả
        </h3>
        <p className="text-base leading-7 text-muted-foreground">
          {variety.description || "Chưa có mô tả cho giống rau này."}
        </p>
      </section>
      <aside className="rounded-xl border border-[#DCE9E0] bg-[#F3F8F4] px-4 py-4 text-sm leading-6 text-muted-foreground">
        Danh mục giống rau tách biệt với kho vật tư hạt giống thực tế. Trang này
        không quản lý nhập/xuất tồn kho.
      </aside>
      <div className="space-y-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl text-base text-muted-foreground"
          onClick={onToggleAvailability}
        >
          {enabled ? "Tắt chọn cho đơn mới" : "Cho phép chọn cho đơn mới"}
        </Button>
        <Button
          type="button"
          className="h-12 w-full rounded-xl text-base"
          onClick={onEdit}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Chỉnh sửa giống rau
        </Button>
      </div>
    </div>
  );
}
