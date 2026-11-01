"use client";
import {
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Waves,
  Fan,
  Lightbulb,
  Wifi,
  WifiOff,
  Plug,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { ReactNode } from "react";
import type { DeviceConnection, DeviceType } from "@/lib/devices";
const icons: Record<DeviceType, LucideIcon> = {
  temperature: Thermometer,
  airHumidity: Wind,
  soilMoisture: Droplets,
  light: Sun,
  waterLevel: Waves,
  pump: Droplets,
  lamp: Lightbulb,
  fan: Fan,
};
export function DeviceIcon({
  type,
  offline = false,
}: {
  type: DeviceType;
  offline?: boolean;
}) {
  const Icon = icons[type];
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${offline ? "bg-red-50 text-red-400" : "bg-secondary text-primary"}`}
    >
      <Icon className="size-5" strokeWidth={1.6} />
    </span>
  );
}
export function Connection({ value }: { value: DeviceConnection }) {
  const Icon = value === "online" ? Wifi : value === "offline" ? WifiOff : Plug;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${value === "online" ? "text-primary" : value === "offline" ? "text-red-600" : "text-muted-foreground"}`}
    >
      <Icon className="size-4" />
      {value === "online"
        ? "Trực tuyến"
        : value === "offline"
          ? "Mất kết nối"
          : "Chưa kết nối"}
    </span>
  );
}
export function DevicePagination({
  total,
  page,
  onPage,
}: {
  total: number;
  page: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 10));
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-5 text-sm text-muted-foreground">
      <p>
        Hiển thị {total ? (page - 1) * 10 + 1 : 0} –{" "}
        {Math.min(page * 10, total)} trong {total} kết quả
      </p>
      <nav aria-label="Phân trang" className="flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Trang trước"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {Array.from({ length: pages }, (_, i) => (
          <Button
            key={i}
            variant={page === i + 1 ? "default" : "ghost"}
            size="icon"
            aria-label={`Trang ${i + 1}`}
            aria-current={page === i + 1 ? "page" : undefined}
            onClick={() => onPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Trang sau"
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </nav>
    </footer>
  );
}
export function DevicePanel({
  title,
  description,
  children,
  footer,
  onClose,
  returnFocus,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  returnFocus: () => void;
}) {
  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="h-dvh w-full! max-w-[560px]! gap-0 overflow-hidden! bg-white"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-5 pr-12">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
        <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
          {footer}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
export const tableHead =
  "bg-[#F7FAF8] [&_th]:px-5 [&_th]:py-4 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-[#759580] [&_th]:whitespace-normal";
