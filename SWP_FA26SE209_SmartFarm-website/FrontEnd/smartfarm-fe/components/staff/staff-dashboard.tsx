"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import {
  AlertTriangle, CalendarCheck, Clock3, Droplets, Lightbulb, PackageCheck,
  Sprout, Thermometer, Truck, UserRound, Waves, WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/ui/loading-state";
import { useAuth } from "@/components/auth/customer-auth-provider";
import { loadDashboardSnapshot, todayKey, zoneForTray, type DashboardSnapshot } from "@/lib/dashboard-live-data";
import { date, time } from "@/lib/formatters";

type DashboardIcon = ComponentType<{ className?: string; strokeWidth?: number }>;
type SummaryStat = { label: string; value: string; description: string; icon: DashboardIcon; tone?: "warning" | "info" };
type Task = { id: string; title: string; location: string; time: string; priority: string; status: "Chưa làm" };
type Delivery = { order: string; status: "Sẵn sàng giao" | "Đang đóng gói"; customer: string; quantity: string; address: string; time: string };
type EnvironmentMetric = { label: string; value: string; icon: DashboardIcon };
type FarmAlert = { id: string; title: string; location: string; current: string; time: string; severity: "Chưa xử lý" | "Trung bình"; icon: DashboardIcon };

const display = (value: number | null | undefined, unit = "") => value == null ? "—" : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}${unit}`;

function StatusBadge({ children, className }: { children: string; className: string }) {
  return <Badge className={`${className} shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium`}>{children}</Badge>;
}

function DashboardSectionHeader({ title, href }: { title: string; href: string }) {
  return <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><h2 className="section-title">{title}</h2><Button asChild variant="ghost" size="sm" className="h-7 px-1 text-[11px] text-primary"><Link href={href}>Xem tất cả</Link></Button></div>;
}

export function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadDashboardSnapshot("staff").then((result) => { if (!cancelled) setData(result); }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Không tải được dashboard."); });
    return () => { cancelled = true; };
  }, []);
  const today = todayKey(new Date());
  const pendingTasks = data?.tasks.filter((task) => todayKey(task.dueDate) === today && task.status === "PENDING" && task.assignedUserId === user?.userId) ?? [];
  const activeCycles = data?.cycles.filter((cycle) => !["HARVESTED", "FAILED"].includes(cycle.cropStatus)) ?? [];
  const openAlerts = data?.alerts.filter((alert) => !alert.isResolved) ?? [];
  const pendingOrders = data?.orders.filter((order) => ["CONFIRMED", "PREPARING"].includes(order.status)) ?? [];
  const summaryStats: SummaryStat[] = [
    { label: "Việc cần làm", value: data && user ? String(pendingTasks.length) : "—", description: "Công việc được giao hôm nay", icon: CalendarCheck },
    { label: "Khay đang trồng", value: data ? String(activeCycles.length) : "—", description: "Đang trong chu kỳ sinh trưởng", icon: Sprout },
    { label: "Cảnh báo", value: data ? String(openAlerts.length) : "—", description: "Cần kiểm tra", icon: AlertTriangle, tone: "warning" },
    { label: "Đơn hàng cần xử lý", value: data ? String(pendingOrders.length) : "—", description: "Đơn hàng đang chờ xử lý", icon: Truck, tone: "info" },
  ];
  const tasks: Task[] = pendingTasks.map((task) => {
    const cycle = data?.cycles.find((item) => item.rentalId === task.rentalId);
    const tray = data?.trays.find((item) => item.soilTrayId === cycle?.soilTrayId);
    return { id: String(task.taskId), title: task.taskName, location: tray ? `${zoneForTray(data!, tray.soilTrayId)} · Khay ${tray.trayCode}` : "—", time: time(task.dueDate), priority: "—", status: "Chưa làm" };
  });
  const todayDeliveries: Delivery[] = (data?.deliveries ?? []).filter((delivery) => delivery.scheduledDeliveryAt && todayKey(delivery.scheduledDeliveryAt) === today && !["DELIVERED", "FAILED"].includes(delivery.status)).map((delivery) => {
    const order = data?.orders.find((item) => item.orderId === delivery.orderId);
    return { order: delivery.orderCode, status: delivery.status === "PACKAGED" || delivery.status === "SHIPPING" ? "Sẵn sàng giao" : "Đang đóng gói", customer: delivery.recipientName, quantity: `${order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0} sản phẩm`, address: delivery.shippingAddress, time: delivery.scheduledDeliveryAt ? time(delivery.scheduledDeliveryAt) : "—" };
  });
  const newest = Object.values(data?.latest ?? {}).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  const environmentMetrics: EnvironmentMetric[] = [
    { label: "Nhiệt độ", value: display(newest?.temperature, "°C"), icon: Thermometer },
    { label: "Độ ẩm không khí", value: display(newest?.airHumidity, "%"), icon: Droplets },
    { label: "Độ ẩm giá thể", value: display(newest?.soilHumidity, "%"), icon: Waves },
    { label: "Ánh sáng", value: display(newest?.lightIntensity, " lux"), icon: Lightbulb },
    { label: "Mực nước", value: display(newest?.waterLevel, "%"), icon: Droplets },
  ];
  const activeAlerts: FarmAlert[] = openAlerts.map((alert) => {
    const assignment = data?.assignments.find((item) => item.deviceId === alert.deviceId);
    const location = assignment ? `${zoneForTray(data!, assignment.soilTrayId)} · Khay ${assignment.trayCode}` : "—";
    return { id: String(alert.alertId), title: alert.message, location, current: alert.alertType, time: `${time(alert.createdAt)}, ${date(alert.createdAt)}`, severity: ["CRITICAL", "HIGH"].includes(alert.severity.toUpperCase()) ? "Chưa xử lý" : "Trung bình", icon: alert.alertType.includes("OFFLINE") ? WifiOff : Thermometer };
  });
  if (!data && !error) return <DashboardSkeleton variant="staff" />;

  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]">
    <div className="mx-auto max-w-[1700px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-[26px] font-bold tracking-tight text-[#1F2937]">Tổng quan</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Tổng quan hoạt động và công việc cần xử lý hôm nay.</p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </header>

      <section aria-label="Chỉ số vận hành" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map(({ icon: Icon, tone, ...stat }) => <Card key={stat.label} className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_#244a3004]"><CardContent className="p-5"><span className={`grid size-9 place-items-center rounded-xl bg-secondary ${tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : "text-primary"}`}><Icon className="size-[18px]" strokeWidth={1.7} /></span><p className="mt-4 text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p><p className="mt-1 text-sm font-medium">{stat.label}</p><p className={`mt-1 text-[11px] ${tone === "warning" ? "text-warning" : "text-success"}`}>{stat.description}</p></CardContent></Card>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <Card className="section-card overflow-hidden"><DashboardSectionHeader title="Công việc hôm nay" href="/staff/tasks" /><div className="px-5 pb-3 sm:px-6">{tasks.map((task) => <div key={task.id} className="flex flex-wrap items-center gap-3 border-t py-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Sprout className="size-4" /></span><div className="min-w-[180px] flex-1"><p className="text-xs font-semibold">{task.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{task.location}</p></div><span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3.5" />{task.time}</span><StatusBadge className="status-amber">{task.priority}</StatusBadge><StatusBadge className="status-amber">{task.status}</StatusBadge><Button asChild size="sm" className="h-8 text-[11px]"><Link href="/staff/tasks">Bắt đầu</Link></Button></div>)}</div></Card>
        <Card className="section-card overflow-hidden"><DashboardSectionHeader title="Giao hàng hôm nay" href="/staff/orders" /><div className="px-5 pb-3 sm:px-6">{todayDeliveries.map((delivery) => <div key={delivery.order} className="border-t py-3"><div className="flex items-center gap-2"><PackageCheck className="size-4 text-primary" /><span className="text-xs font-semibold text-primary">{delivery.order}</span><StatusBadge className={delivery.status === "Sẵn sàng giao" ? "status-green" : "status-amber"}>{delivery.status}</StatusBadge><span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3.5" />{delivery.time}</span></div><div className="mt-2 flex items-start gap-2 pl-6"><UserRound className="mt-0.5 size-3.5 text-muted-foreground" /><div><p className="text-xs font-medium">{delivery.customer}</p><p className="mt-1 text-[11px] text-muted-foreground">{delivery.quantity} · {delivery.address}</p></div></div></div>)}</div></Card>
      </section>

      <section aria-labelledby="environment-title"><h2 id="environment-title" className="section-title mb-3">Giám sát môi trường</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{environmentMetrics.map(({ icon: Icon, ...metric }) => <Card key={metric.label} className="h-full rounded-2xl border border-border bg-white shadow-[0_1px_3px_#244a3004]"><CardContent className="flex min-h-[152px] flex-col p-4"><Icon className="size-[18px] text-primary" strokeWidth={1.8} /><p className="mt-3 text-[11px] text-muted-foreground">{metric.label}</p><p className="mt-1 text-xl font-bold tracking-tight">{metric.value}</p><p className="mt-auto pt-3 text-[11px] text-success">● {newest ? newest.isStale ? "Dữ liệu cũ" : "Trực tuyến" : "Chưa có dữ liệu"}</p><p className="mt-1 text-[10px] text-muted-foreground">{newest ? `Cập nhật ${time(newest.recordedAt)}, ${date(newest.recordedAt)}` : "—"}</p></CardContent></Card>)}</div></section>

      <section className="section-card overflow-hidden"><DashboardSectionHeader title="Cảnh báo cần xử lý" href="/staff/alerts" /><div className="px-5 pb-2 sm:px-6">{activeAlerts.map(({ icon: Icon, ...alert }) => <div key={alert.id} className="grid gap-3 border-t py-3 sm:grid-cols-[32px_minmax(190px,1.25fr)_minmax(150px,.8fr)_minmax(120px,.45fr)_auto] sm:items-center"><span className={`grid size-8 place-items-center rounded-full ${alert.severity === "Chưa xử lý" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}><Icon className="size-4" /></span><div><p className="text-xs font-medium">{alert.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{alert.location}</p></div><div className="text-[11px] text-muted-foreground"><p>{alert.current}</p><p className="mt-1">{alert.time}</p></div><StatusBadge className={alert.severity === "Chưa xử lý" ? "border-0 bg-red-50 text-red-600" : "status-amber"}>{alert.severity}</StatusBadge><Button asChild variant="outline" size="sm" className="h-7 border-primary/50 text-[11px] text-primary hover:bg-secondary"><Link href="/staff/alerts">Xem chi tiết</Link></Button></div>)}</div></section>
    </div>
  </main>;
}
