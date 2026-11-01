"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Layers3,
  Grid2X2,
  CheckCircle2,
  MapPin,
  Radio,
  Wifi,
  WifiOff,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOperations } from "../shared/operations-provider";
import { SummaryCards, PhysicalStatus, EmptyState } from "../shared/ui";
import { areaStats } from "@/lib/operations/selectors";
import { AreaTrayMap } from "./area-tray-map";
import { AreaFormSheet } from "./area-form-sheet";
import { useTrayActions } from "../trays/operations-dialogs";
import { Skeleton } from "@/components/ui/skeleton";
import { stamp } from "@/lib/formatters";
import {
  useOperationsRoutes,
  withOperationsQuery,
} from "../shared/operations-routes";
export function AreaDetail({ areaId, rackId, trayId }: { areaId: string; rackId?: string; trayId?: string }) {
  const { state, areaDetail, loading, error, reload } = useOperations();
  const { openAction } = useTrayActions();
  const routes = useOperationsRoutes();
  const area = state.areas.find((a) => a.id === areaId);
  const [edit, setEdit] = useState(false);
  const openedTray = useRef<string | null>(null);
  useEffect(() => {
    if (trayId && openedTray.current !== trayId && state.trays.some((tray) => tray.id === trayId)) {
      openedTray.current = trayId;
      openAction("detail", trayId);
    }
  }, [openAction, state.trays, trayId]);
  if (loading) return <div className="mx-auto max-w-[1700px] space-y-4 p-6" role="status" aria-label="Đang tải chi tiết khu vực"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (error) return <div className="mx-auto max-w-[1700px] p-6 text-center"><p className="text-sm text-destructive">Không thể tải chi tiết khu vực.</p><Button className="mt-4" variant="outline" onClick={() => void reload()}>Thử lại</Button></div>;
  if (!area)
    return (
      <div className="p-8">
        <EmptyState
          title="Không tìm thấy khu vực"
          description="Khu vực không tồn tại hoặc không còn trong phiên làm việc."
          action={
            <Button asChild>
              <Link href={withOperationsQuery(routes.trays, { tab: "areas" })}>
                Về danh sách khu vực
              </Link>
            </Button>
          }
        />
      </div>
    );
  const stats = areaStats(state, area);
  const devices = state.devices.filter((d) => d.areaId === area.id);
  return (
    <main className="mx-auto min-h-[calc(100dvh-80px)] w-full max-w-[1700px] min-w-0 space-y-6 bg-white p-4 sm:p-6 lg:p-8">
      <Link
        href={withOperationsQuery(routes.trays, { tab: "areas" })}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Khu vực & khay trồng
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{area.name}</h1>
            <PhysicalStatus status={area.status} />
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {area.code} · {area.location}
          </p>
          <p className="subtle mt-2 max-w-2xl">{area.description}</p>
        </div>
        {!routes.readOnly && (
          <Button onClick={() => { void areaDetail(area.id).then((detail) => { if (detail) setEdit(true); }); }}>
            <Pencil className="size-4" />
            Chỉnh sửa khu vực
          </Button>
        )}
      </div>
      <SummaryCards
        label={area.name}
        items={[
          {
            label: "Số kệ",
            value: area.shelves.length,
            icon: <Layers3 className="size-4" />,
          },
          {
            label: "Tổng vị trí",
            value: stats.positions,
            icon: <Grid2X2 className="size-4" />,
          },
          {
            label: "Khay đã bố trí",
            value: stats.installed,
            icon: <Grid2X2 className="size-4" />,
          },
          {
            label: "Khay sẵn sàng",
            value: stats.available,
            icon: <CheckCircle2 className="size-4" />,
          },
        ]}
      />
      <AreaTrayMap area={area} rackId={rackId} />
      <section className="section-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Thiết bị trong khu vực</h2>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link href={withOperationsQuery(routes.monitoring, { area: area.id })}>
              Giám sát IoT
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
        {devices.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-3 rounded-xl border p-4"
              >
                <span className="rounded-lg bg-muted p-2">
                  <Radio className="size-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium">{d.name}</h3>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {d.kind === "sensor" ? "Cảm biến" : "Thiết bị chấp hành"} ·{" "}
                    {d.id}
                  </p>
                  <p
                    className={`mt-2 flex items-center gap-1 text-[10px] ${d.online ? "text-primary" : "text-amber-700"}`}
                  >
                    {d.online ? (
                      <Wifi className="size-3" />
                    ) : (
                      <WifiOff className="size-3" />
                    )}
                    {d.online ? "Đã kết nối" : "Mất kết nối"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {stamp(d.received)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có thiết bị"
            description="Khu vực này chưa được liên kết cảm biến hoặc thiết bị chấp hành."
          />
        )}
      </section>
      {!routes.readOnly && edit && (
        <AreaFormSheet area={area} onClose={() => setEdit(false)} />
      )}
    </main>
  );
}
