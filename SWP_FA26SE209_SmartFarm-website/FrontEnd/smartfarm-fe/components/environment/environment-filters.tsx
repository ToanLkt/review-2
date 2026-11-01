"use client";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnvironmentDevice } from "@/lib/environment";
export function EnvironmentFilters({
  area,
  device,
  devices,
  areas,
  counts,
  onAreaChange,
  onDeviceChange,
  layout,
  onLayoutChange,
}: {
  area: string;
  device: string;
  devices: EnvironmentDevice[];
  areas: { id: string; name: string }[];
  counts: { current: number; stale: number; offline: number };
  onAreaChange: (v: string) => void;
  onDeviceChange: (v: string) => void;
  layout: "grid" | "list";
  onLayoutChange: (view: "grid" | "list") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={area || "all"}
        onValueChange={(v) => onAreaChange(v === "all" ? "" : v)}
      >
        <SelectTrigger
          aria-label="Lọc khu vực"
          className="h-10 w-full rounded-xl bg-white sm:w-44"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả khu vực</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={device || "all"}
        onValueChange={(v) => onDeviceChange(v === "all" ? "" : v)}
      >
        <SelectTrigger
          aria-label="Lọc thiết bị"
          className="h-10 w-full min-w-0 rounded-xl bg-white sm:w-80"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-32px)]">
          <SelectItem value="all">Tất cả thiết bị</SelectItem>
          {devices.map((d) => (
            <SelectItem className="whitespace-normal" key={d.id} value={d.id}>
              {d.name} · {d.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div
        aria-label="Trạng thái các chỉ số đang hiển thị"
        aria-live="polite"
        className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground sm:ml-auto"
      >
        {[
          [counts.current, "hiện tại", "bg-primary"],
          [counts.stale, "dữ liệu cũ", "bg-amber-500"],
          [counts.offline, "mất kết nối", "bg-red-500"],
        ].map(([count, label, color]) => (
          <span className="inline-flex items-center gap-2" key={label}>
            <span
              aria-hidden="true"
              className={"size-2 rounded-full " + color}
            />
            {count} {label}
          </span>
        ))}
      </div>
      <div
        className="flex rounded-lg border bg-white p-0.5"
        role="group"
        aria-label="Kiểu hiển thị chỉ số môi trường"
      >
        <Button
          type="button"
          size="icon"
          variant={layout === "grid" ? "secondary" : "ghost"}
          className="size-8"
          aria-label="Xem dạng lưới"
          aria-pressed={layout === "grid"}
          onClick={() => onLayoutChange("grid")}
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={layout === "list" ? "secondary" : "ghost"}
          className="size-8"
          aria-label="Xem dạng danh sách"
          aria-pressed={layout === "list"}
          onClick={() => onLayoutChange("list")}
        >
          <List className="size-4" />
        </Button>
      </div>
    </div>
  );
}
