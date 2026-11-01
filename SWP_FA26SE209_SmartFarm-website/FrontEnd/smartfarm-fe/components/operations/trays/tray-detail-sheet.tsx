"use client";
import Link from "next/link";
import {
  ImageOff,
  Thermometer,
  Droplets,
  Sun,
  Waves,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DetailField } from "@/components/dashboard/shared";
import { PhysicalStatus, EmptyState } from "../shared/ui";
import { useOperations } from "../shared/operations-provider";
import {
  locationOf,
  currentAssignment,
  currentCycle,
} from "@/lib/operations/selectors";
import { stamp, date, number } from "@/lib/formatters";
import type { PhysicalTray } from "@/lib/operations/types";
import { TrayActionMenu } from "./tray-action-menu";
import {
  useOperationsRoutes,
  withOperationsQuery,
} from "../shared/operations-routes";
export function TrayDetailSheet({
  tray,
  onClose,
}: {
  tray: PhysicalTray;
  onClose: () => void;
}) {
  const { state } = useOperations();
  const routes = useOperationsRoutes();
  const loc = locationOf(state, tray);
  const assignment = currentAssignment(state, tray.id);
  const cycle = currentCycle(state, tray.id);
  const readings = state.devices.filter(
    (d) => d.areaId === loc.area?.id && d.kind === "sensor",
  );
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:!max-w-[720px]">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-6">
            <SheetTitle>{tray.code}</SheetTitle>
            <PhysicalStatus status={tray.status} />
            <TrayActionMenu tray={tray} insideDetail />
          </div>
          <SheetDescription>{loc.label}</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="info" className="px-6 pb-8">
          <TabsList className="mb-3 grid w-full grid-cols-3">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="monitoring">Theo dõi</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <h3 className="mt-3 text-sm font-semibold">
              Thông tin khay vật lý
            </h3>
            <dl className="grid gap-x-5 sm:grid-cols-2">
              <DetailField label="Mã khay">{tray.code}</DetailField>
              <DetailField label="Loại / kích thước">
                {tray.specification}
              </DetailField>
              <DetailField label="Vị trí hiện tại">{loc.label}</DetailField>
              <DetailField label="Trạng thái khay">
                <PhysicalStatus status={tray.status} />
              </DetailField>
              <DetailField label="Ghi chú">{tray.notes || "—"}</DetailField>
            </dl>
            <h3 className="mt-6 text-sm font-semibold">
              Phân bổ và chu kỳ hiện tại
            </h3>
            <dl className="grid gap-x-5 sm:grid-cols-2">
              <DetailField label="Khách hàng">
                {assignment?.customer ?? "—"}
              </DetailField>
              <DetailField label="Đơn thuê liên kết">
                {assignment ? (
                  <Link
                    className="text-primary underline"
                    href={withOperationsQuery(routes.orders, {
                      order: assignment.orderId,
                    })}
                  >
                    {assignment.orderCode || "—"}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailField>
              <DetailField label="Chu kỳ trồng">
                {cycle ? (
                  <Link
                    className="text-primary underline"
                    href={withOperationsQuery(routes.cycles, {
                      cycle: cycle.id,
                    })}
                  >
                    {cycle.id}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailField>
              <DetailField label="Loại rau">
                {cycle?.seed ??
                  (assignment
                    ? state.items.find((i) => i.id === assignment.itemId)?.seed
                    : "—")}
              </DetailField>
              <DetailField label="Ngày gieo">
                {cycle ? date(cycle.sowed) : "—"}
              </DetailField>
              <DetailField label="Dự kiến thu hoạch">
                {cycle ? date(cycle.harvest) : "—"}
              </DetailField>
              <DetailField label="Giai đoạn cây">
                {cycle?.stage ?? "—"}
              </DetailField>
            </dl>
          </TabsContent>
          <TabsContent value="monitoring">
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted">
              <ImageOff className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Chưa có ảnh khay</p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                Số đo môi trường dùng chung
              </h3>
              <Button asChild variant="ghost" size="sm">
                <Link
                  href={withOperationsQuery(routes.monitoring, {
                    area: loc.area?.id,
                  })}
                >
                  Giám sát IoT
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
            <p className="subtle mb-4">
              Số đo từ cảm biến tại {loc.area?.name ?? "khu vực"}. Khay này chưa
              có cảm biến riêng.
            </p>
            {readings.length ? (
              readings.map((d) => (
                <div key={d.id} className="mb-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium">{d.name}</p>
                    <span
                      className={
                        d.online
                          ? "text-[10px] text-primary"
                          : "text-[10px] text-amber-700"
                      }
                    >
                      {d.online ? "Đã kết nối" : "Dữ liệu cũ"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      {
                        label: "Nhiệt độ",
                        value:
                          d.temperature === undefined
                            ? "—"
                            : number(d.temperature) + "°C",
                        icon: Thermometer,
                      },
                      {
                        label: "Độ ẩm không khí",
                        value:
                          d.humidity === undefined ? "—" : d.humidity + "%",
                        icon: Droplets,
                      },
                      {
                        label: "Ánh sáng",
                        value:
                          d.light === undefined
                            ? "—"
                            : number(d.light) + " lux",
                        icon: Sun,
                      },
                      { label: "Mực nước", value: d.water ?? "—", icon: Waves },
                    ].map((v) => (
                      <div key={v.label}>
                        <p className="mb-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <v.icon className="size-3" />
                          {v.label}
                        </p>
                        <p className="text-xs font-medium">{v.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="subtle mt-3">Cập nhật: {stamp(d.received)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Chưa có số đo"
                description="Chưa có cảm biến liên kết với vị trí khay này."
              />
            )}
          </TabsContent>
          <TabsContent value="history">
            <ol className="mt-3">
              {[...tray.history]
                .sort((a, b) => b.at.localeCompare(a.at))
                .map((e) => (
                  <li
                    key={e.id}
                    className="relative ml-3 border-l pb-6 pl-6 last:border-transparent"
                  >
                    <span className="absolute top-0 -left-3 rounded-full border bg-muted p-1">
                      <Clock3 className="size-3.5 text-primary" />
                    </span>
                    <p className="text-sm">{e.text}</p>
                    <p className="subtle mt-1">
                      {stamp(e.at)} · {e.staff}
                    </p>
                  </li>
                ))}
            </ol>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
