"use client";
import { useState } from "react";
import { SummaryCard } from "@/components/admin/summary-card";
import {
  CalendarDays,
  Download,
  RefreshCw,
  Info,
  ChevronDown,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { vi } from "react-day-picker/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSkeleton } from "@/components/ui/loading-state";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { FilterSelect } from "@/components/dashboard/shared";
import { useLiveDashboard } from "@/components/dashboard/live-dashboard-provider";
import { zoneForTray } from "@/lib/dashboard-live-data";
import { EnvironmentChart } from "@/components/dashboard/environment-chart";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { TasksActivity } from "@/components/dashboard/tasks-activity";
import { date, time, inRange } from "@/lib/formatters";
import {
  filteredOrders,
  dashboardCsv,
} from "@/lib/dashboard-data";
export default function Dashboard() {
  const { raw, alerts, orders, tasks, activities, trays, devices, areas, capacityByArea, loading, error, updated, refresh } = useLiveDashboard();
  const [area, setArea] = useState("Tất cả khu vực");
  const [now] = useState(() => new Date());
  const [range, setRange] = useState<DateRange | undefined>(() => ({ from: new Date(now.getTime() - 6 * 86400000), to: now }));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [tab, setTab] = useState("all");
  const matches = (x: { area: string }) =>
    area === "Tất cả khu vực" || x.area === area;
  const areaTrays = trays.filter(matches);
  const areaDevices = devices.filter(matches);
  const areaAlerts = alerts.filter(matches);
  const areaTasks = tasks.filter(matches);
  const visibleTrays = areaTrays;
  const visibleOrders = filteredOrders(orders, tab, range?.from, range?.to);
  const visibleActivities = activities.filter((a) =>
    inRange(a.at, range?.from, range?.to),
  );
  const capacity = area === "Tất cả khu vực" ? Object.values(capacityByArea).reduce((sum, count) => sum + count, 0) : (capacityByArea[area] ?? 0);
  const rented = raw?.trays.filter((tray) => tray.currentStatus === "RENTED" && (area === "Tất cả khu vực" || zoneForTray(raw, tray.soilTrayId) === area)).length ?? 0;
  const empty = raw?.trays.filter((tray) => tray.currentStatus === "AVAILABLE" && (area === "Tất cả khu vực" || zoneForTray(raw, tray.soilTrayId) === area)).length ?? 0;
  const currentTime = updated ? new Date(updated).getTime() : now.getTime();
  const harvest = areaTrays.filter((tray) => {
    const date = new Date(tray.harvest).getTime();
    return date >= currentTime && date <= currentTime + 3 * 86400000;
  }).length;
  const pendingOrders = orders.filter((order) => raw?.orders.some((source) => source.orderCode === order.id && source.status === "CONFIRMED"));
  const metrics = {
    capacity, rented, empty, harvest,
    online: areaDevices.filter((device) => device.online).length,
    devices: areaDevices.length, offline: areaDevices.filter((device) => !device.online).length,
    pending: pendingOrders.length,
    rental: pendingOrders.filter((order) => order.kind === "rental").length,
    retail: pendingOrders.filter((order) => order.kind === "retail").length,
  };
  const period = range?.from
    ? `${date(range.from)} – ${date(range.to ?? range.from)}`
    : "Chọn khoảng ngày";
  const kpis = [
    {
      label: "Khay đang thuê",
      value: `${metrics.rented}/${metrics.capacity}`,
      support: `${metrics.empty} khay còn trống`,
      color: "text-[#88A893]",
      path: "trays",
    },
    {
      label: "Sắp thu hoạch",
      value: `${metrics.harvest}`,
      suffix: "khay",
      support: "Trong 3 ngày tới",
      color: "text-primary",
      path: "harvests",
    },
    {
      label: "Thiết bị trực tuyến",
      value: `${metrics.online}/${metrics.devices}`,
      support: `${metrics.offline} thiết bị mất kết nối`,
      color: metrics.offline ? "text-amber-600" : "text-primary",
      path: "iot",
    },
    {
      label: "Đơn chờ xử lý",
      value: String(metrics.pending),
      support: `${metrics.rental} thuê khay · ${metrics.retail} mua hạt giống`,
      color: "text-blue-500",
      path: "orders",
    },
  ];
  function exportCsv() {
    const csv = dashboardCsv({
      source: "DỮ LIỆU THỰC",
      capturedAt: updated ?? "",
      area,
      period,
      trays: visibleTrays,
      devices: areaDevices,
      alerts: areaAlerts,
      orders: visibleOrders,
      tasks: areaTasks,
      activities: visibleActivities,
      metrics,
    });
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "SmartFarm-bao-cao.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Đã xuất báo cáo theo bộ lọc hiện tại.");
  }
  if (loading && !raw) return <DashboardSkeleton variant="admin" />;
  return (
    <main className="mx-auto min-h-[calc(100dvh-80px)] w-full max-w-[1700px] min-w-0 space-y-5 bg-white p-4 sm:p-6 lg:p-8">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow mb-2 text-primary">SMARTFARM / TỔNG QUAN</p>
            <h1 className="text-[25px] font-semibold tracking-tight">
              Tổng quan nông trại
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              Theo dõi khay trồng, đơn hàng và hoạt động nông trại hôm nay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <FilterSelect
              label="Lọc khu vực toàn dashboard"
              value={area}
              onChange={setArea}
              options={["Tất cả khu vực", ...areas]}
              className="h-9 border-primary bg-primary text-xs text-[#1F2937] hover:bg-[#3F7655] focus-visible:ring-primary/30 *:data-[slot=select-value]:text-[#1F2937] [&_svg]:text-[#1F2937]"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button className="h-9 bg-primary text-[11px] font-normal text-[#1F2937] hover:bg-[#3F7655] [&_svg]:text-[#1F2937]">
                  <CalendarDays className="size-3.5" />
                  {period}
                  <ChevronDown className="size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-auto max-w-[calc(100vw-24px)] p-0"
              >
                <Calendar
                  mode="range"
                  locale={vi}
                  selected={range}
                  onSelect={(r) =>
                    setRange(
                      r?.from
                        ? { from: r.from, to: r.to ?? r.from }
                        : undefined,
                    )
                  }
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                />
                <div className="flex gap-2 border-t p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setCalendarMonth(today);
                      setRange({ from: today, to: today });
                    }}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRange({
                        from: new Date(Date.now() - 6 * 86400000),
                        to: new Date(),
                      })
                    }
                  >
                    7 ngày
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              className="h-9 bg-primary text-xs text-[#1F2937] hover:bg-[#3F7655] [&_svg]:text-[#1F2937]"
              onClick={exportCsv}
            >
              <Download className="size-3.5" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md border-primary/15 bg-secondary/50 text-[10px] font-normal text-primary"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            Dữ liệu trực tiếp
          </Badge>
          <span>Cập nhật lúc {updated ? time(updated) : "—"}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label="Làm mới dữ liệu"
                disabled={loading}
                onClick={() => void refresh()}
              >
                <RefreshCw
                  className={`size-3 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Làm mới dữ liệu</TooltipContent>
          </Tooltip>
          <span className="ml-auto flex items-center gap-1.5">
            <Info className="size-3" />
            {error ?? "Dữ liệu từ hệ thống"}
          </span>
        </div>
      </section>
      <section aria-label="Chỉ số hiện tại">
        <div className="mb-2 flex items-center gap-2">
          <p className="eyebrow">Ảnh chụp trạng thái hiện tại</p>
          <span className="text-[10px] text-muted-foreground">
            · {date(now)}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <SummaryCard
              key={k.label}
              label={k.label}
              value={
                loading ? (
                  <Skeleton className="h-[37.5px] w-28" />
                ) : !raw ? (
                  "—"
                ) : (
                  `${k.value}${k.suffix ? ` ${k.suffix}` : ""}`
                )
              }
              support={k.support}
              color={k.color}
              href={`/admin/${k.path}`}
            />
          ))}
        </div>
      </section>
      <p className="flex gap-2 rounded-lg border border-primary/10 bg-secondary/25 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" />
        Khu vực lọc khay, thiết bị, cảnh báo và công việc. Khoảng ngày lọc biểu
        đồ, đơn hàng và hoạt động. KPI là trạng thái hiện tại; đơn hàng toàn
        nông trại không lọc theo khu vực.
      </p>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <EnvironmentChart globalArea={area} range={range} devices={devices} areas={areas} />
        <AlertsPanel alerts={areaAlerts} />
      </div>

      <OrdersTable orders={visibleOrders} tab={tab} setTab={setTab} />
      <TasksActivity tasks={areaTasks} activities={visibleActivities} />
      <footer className="flex flex-wrap justify-between gap-2 border-t pt-5 text-[10px] text-muted-foreground">
        <span>© 2026 SmartFarm · Chăm từng mầm xanh.</span>
        <span>Hệ thống quản lý nông trại rau mầm đô thị</span>
      </footer>
    </main>
  );
}
