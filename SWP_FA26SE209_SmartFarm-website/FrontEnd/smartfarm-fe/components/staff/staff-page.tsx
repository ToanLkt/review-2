"use client";

import { StaffOrders } from "./staff-orders";
import { StaffPayments } from "./staff-payments";
import { StaffDeliveries } from "./staff-deliveries";
import { StaffNotifications } from "./staff-notifications";
import { StaffFarmInfrastructure } from "./staff-farm-infrastructure";
import { StaffInventory } from "./staff-inventory";
import { StaffTelemetry } from "./staff-telemetry";
import { StaffCultivation, StaffCultivationTasks } from "./staff-cultivation";
import { StaffIoT } from "./staff-iot";
import { StaffProfile } from "./staff-profile";
import { useState } from "react";
import { AlertTriangle, Droplets, Lightbulb, ListChecks, PackageCheck, Sprout, Thermometer, Waves, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Page = "dashboard" | "trays" | "cultivation" | "environment" | "devices" | "controls" | "tasks" | "inventory" | "orders" | "payments" | "deliveries" | "notifications" | "alerts" | "profile";
const tasks = [
  { title: "Kiểm tra khay B-08", place: "Khu B · Khay B-08", time: "08:30", priority: "Cao", status: "Chưa làm" },
  { title: "Kiểm tra mức nước", place: "Khu A · Bồn dinh dưỡng số 1", time: "10:00", priority: "Trung bình", status: "Chưa làm" },
  { title: "Thu hoạch rau mầm cải xanh", place: "Khu C · Khay C-03", time: "14:00", priority: "Cao", status: "Chưa làm" },
];
const alerts = [{ title: "Độ ẩm giá thể thấp", place: "Khu B · Khay B-08", value: "38% · Ngưỡng < 40%", time: "8 phút trước" }, { title: "Thiết bị mất kết nối", place: "Khu C · Cảm biến TB-C02", value: "Chưa nhận dữ liệu", time: "12 phút trước" }];

const statusClass = (status: string) => status.includes("Cần") || status.includes("Chưa") || status.includes("Chờ") || status.includes("Cao") ? "status-amber" : status.includes("Mất") ? "status-red" : "status-green";
function Status({ children }: { children: string }) { return <Badge className={`${statusClass(children)} rounded-md px-2 py-0.5 text-[10px] font-medium`}>{children}</Badge>; }
function PageHead({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) { return <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[26px] font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p></div>{children}</header>; }
function Metric({ label, value, detail, icon: Icon, tone = "text-primary" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: string }) { return <Card className="rounded-2xl border shadow-none"><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div><span className={`grid size-10 place-items-center rounded-xl bg-secondary ${tone}`}><Icon className="size-5" /></span></CardContent></Card>; }

function Dashboard() { const [active, setActive] = useState<string | null>(null); return <div className="space-y-6"><PageHead title="Tổng quan" subtitle="Tổng quan hoạt động và công việc cần xử lý hôm nay."/><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Việc cần làm" value="8" detail="Công việc được giao hôm nay" icon={ListChecks}/><Metric label="Khay đang trồng" value="24" detail="Đang trong chu kỳ sinh trưởng" icon={Sprout}/><Metric label="Cảnh báo" value="3" detail="Cần kiểm tra" icon={AlertTriangle} tone="text-amber-600"/><Metric label="Đơn hàng cần xử lý" value="5" detail="Đơn hàng đang chờ xử lý" icon={PackageCheck} tone="text-blue-600"/></section><section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]"><Card className="section-card"><CardContent className="p-5"><h2 className="section-title">Công việc hôm nay</h2><div className="mt-3 divide-y">{tasks.map(task => <div className="flex items-center gap-3 py-3" key={task.title}><span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><ListChecks className="size-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{task.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{task.place} · {task.time}</p></div><Status>{task.status}</Status><Button size="sm" className="h-8 text-[11px]" onClick={() => setActive(task.title)}>{active === task.title ? "Hoàn thành" : "Bắt đầu"}</Button></div>)}</div></CardContent></Card><Card className="section-card"><CardContent className="p-5"><h2 className="section-title">Cảnh báo cần xử lý</h2><div className="mt-3 space-y-3">{alerts.map(a => <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3" key={a.title}><div className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 text-amber-600"/><div><p className="text-xs font-semibold">{a.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{a.place}</p><p className="mt-1 text-[10px] text-amber-700">{a.value}</p></div></div><Button variant="link" className="mt-1 h-auto px-0 text-[11px] text-primary">Xem chi tiết</Button></div>)}</div></CardContent></Card></section><EnvironmentSummary/></div>; }
function EnvironmentSummary() { const metrics = [["Nhiệt độ", "25.4°C", Thermometer], ["Độ ẩm không khí", "68%", Droplets], ["Độ ẩm giá thể", "58%", Waves], ["Ánh sáng", "820 lux", Lightbulb], ["Mực nước", "72%", Droplets]] as [string,string,LucideIcon][]; return <section><div className="mb-3 flex items-center justify-between"><h2 className="section-title">Giám sát môi trường</h2><span className="text-[11px] text-muted-foreground">Cập nhật 10 giây trước</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(([name, value, Icon]) => <Card className="border shadow-none" key={name}><CardContent className="p-4"><Icon className="size-4 text-primary"/><p className="mt-3 text-[11px] text-muted-foreground">{name}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-[10px] text-success">● Bình thường</p></CardContent></Card>)}</div></section>; }

function Trays() { return <StaffFarmInfrastructure />; }
function Environment() { return <StaffTelemetry />; }
function Devices() { return <StaffIoT />; }
function Controls() { return <StaffIoT initialView="devices" />; }
function Tasks() { return <StaffCultivationTasks />; }
function Alerts() { return <StaffIoT initialView="alerts" />; }
function Profile(){return <StaffProfile />;}
export function StaffPage({ page }: { page: Page }) { const content = {dashboard:<Dashboard/>,trays:<Trays/>,cultivation:<StaffCultivation/>,environment:<Environment/>,devices:<Devices/>,controls:<Controls/>,tasks:<Tasks/>,inventory:<StaffInventory/>,orders:<StaffOrders/>,payments:<StaffPayments/>,deliveries:<StaffDeliveries/>,notifications:<StaffNotifications/>,alerts:<Alerts/>,profile:<Profile/>}[page]; return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]"><div className="mx-auto max-w-[1700px] space-y-0 p-4 sm:p-6 lg:p-8">{content}</div></main>; }
