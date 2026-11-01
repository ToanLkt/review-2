"use client";
import Link from "next/link";
import {
  MapPin,
  Layers3,
  MoreHorizontal,
  ArrowUpRight,
  Pencil,
  Wrench,
  Sprout,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PhysicalStatus } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import { areaStats } from "@/lib/operations/selectors";
import type { GrowingArea } from "@/lib/operations/types";
import { useOperationsRoutes } from "../shared/operations-routes";
export function AreaMenu({
  area,
  onEdit,
  onMaintenance,
}: {
  area: GrowingArea;
  onEdit: () => void;
  onMaintenance: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={"Thao tác " + area.name}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={area.status !== "Hoạt động"}
          onSelect={onMaintenance}
        >
          <Wrench />
          Chuyển sang bảo trì
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function AreaCard({
  area,
  onEdit,
  onMaintenance,
}: {
  area: GrowingArea;
  onEdit: () => void;
  onMaintenance: () => void;
}) {
  const { state } = useOperations();
  const routes = useOperationsRoutes();
  const s = areaStats(state, area);
  const percent = Math.round((s.installed / s.positions) * 100);
  return (
    <Card className="section-card overflow-hidden">
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl border border-primary/10 bg-secondary/60 text-lg font-semibold text-primary">
            {area.name.replace("Khu ", "")}
          </span>
          <div>
            <h2 className="text-base font-semibold">{area.name}</h2>
            <p className="mt-1 text-[10px] font-medium tracking-wider text-muted-foreground">
              {area.code}
            </p>
          </div>
        </div>
        {!routes.readOnly && (
          <AreaMenu area={area} onEdit={onEdit} onMaintenance={onMaintenance} />
        )}
      </div>
      <div className="space-y-4 px-5 pb-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span>{area.location}</span>
        </div>
        <div className="flex items-center justify-between">
          <PhysicalStatus status={area.status} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Layers3 className="size-3.5" />
            {area.shelves.length} kệ
          </span>
        </div>
        <div className="rounded-xl bg-muted/70 p-3.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">
              Khay đã bố trí / vị trí tối đa
            </span>
            <strong>
              {s.installed}/{s.positions}
            </strong>
          </div>
          <div
            role="progressbar"
            aria-label={"Công suất " + area.name}
            aria-valuenow={s.installed}
            aria-valuemin={0}
            aria-valuemax={s.positions}
            className="my-2.5 h-1.5 overflow-hidden rounded-full bg-border"
          >
            <div
              className="h-full rounded-full bg-primary/75"
              style={{ width: percent + "%" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {s.positions - s.installed} vị trí trống · {percent}% đã bố trí
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-primary">{s.available}</p>
            <p className="text-[10px] text-muted-foreground">Sẵn sàng</p>
          </div>
          <div className="border-x">
            <p className="text-lg font-semibold">{s.growing}</p>
            <p className="text-[10px] text-muted-foreground">Đang trồng</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-muted-foreground">
              {s.maintenance}
            </p>
            <p className="text-[10px] text-muted-foreground">Bảo trì</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t px-5 py-3">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Sprout className="size-3.5 text-primary" />
          {s.ready} khay sẵn sàng thu hoạch
        </span>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 px-0 text-[11px] text-primary"
        >
          <Link href={`${routes.trays}/areas/${area.id}`}>
            Xem chi tiết
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
