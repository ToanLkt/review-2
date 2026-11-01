"use client";

import { LoadingState } from "@/components/ui/loading-state";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { date } from "@/lib/formatters";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import type { CultivationSupply, DailyTask, GrowingCycle } from "@/lib/api/staff/staff-cultivation-service";
import type { SoilTray } from "@/lib/api/staff/staff-farm-service";
import { cropStatusLabel } from "./staff-cycles-page";

type Detail = { cycle: GrowingCycle; supply?: CultivationSupply; tray?: SoilTray; tasks: DailyTask[] };

export function StaffCycleDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [action, setAction] = useState<"next" | "tasks" | null>(null);

  async function runAction(kind: "next" | "tasks") {
    const rentalId = detail?.cycle.rentalId;
    if (!rentalId || action) return;
    setAction(kind);
    try {
      if (kind === "next") {
        await staffCultivationService.nextCycle(rentalId);
        toast.success("Đã bắt đầu chu kỳ trồng tiếp theo.");
      } else {
        const result = await staffCultivationService.generateTasks(rentalId);
        toast.success(`Đã tạo ${result.created} công việc chăm sóc.`);
      }
      setReload((value) => value + 1);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật chu kỳ.");
    } finally {
      setAction(null);
    }
  }

  useEffect(() => {
    let active = true;
    const rentalId = Number(id);
    if (!Number.isInteger(rentalId) || rentalId < 1) {
      queueMicrotask(() => { if (active) { setLoading(false); setError("Mã chu kỳ không hợp lệ."); } });
      return () => { active = false; };
    }
    queueMicrotask(() => { if (active) { setLoading(true); setError(""); } });
    staffCultivationService.cycles()
      .then(async (cycles) => {
        const cycle = cycles.find((item) => item.rentalId === rentalId);
        if (!cycle) { if (active) setDetail(null); return; }
        const [supply, trays, tasks] = await Promise.all([
          staffCultivationService.supply(cycle.supplyId),
          staffFarmService.trays(),
          staffCultivationService.tasks({ rentalId }),
        ]);
        if (active) setDetail({ cycle, supply, tray: trays.find((item) => item.soilTrayId === cycle.soilTrayId), tasks });
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải chi tiết chu kỳ."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]"><div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
    <Button asChild variant="ghost" className="-ml-3"><Link href="/staff/cycles"><ArrowLeft />Quay lại danh sách</Link></Button>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vận hành / Chu kỳ</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Chi tiết chu kỳ #{id}</h1></div><Button variant="outline" onClick={() => setReload((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button></header>
    {loading ? <LoadingState label="Đang tải chu kỳ..." className="rounded-2xl bg-white" />
      : error ? <div role="alert" className="rounded-2xl bg-white p-8 text-sm text-destructive">{error}</div>
      : !detail ? <div className="rounded-2xl bg-white p-8 text-sm text-muted-foreground">Không tìm thấy chu kỳ #{id}.</div>
      : <><div className="flex flex-wrap items-center gap-3"><Badge variant="outline" className="bg-white">{cropStatusLabel(detail.cycle.cropStatus)}</Badge><span className="text-sm text-muted-foreground">Đợt {detail.cycle.currentCycle}/{detail.cycle.totalCycles}</span>{detail.cycle.hasNextCycle && detail.cycle.cropStatus === "HARVESTED" && <Button disabled={action !== null} onClick={() => void runAction("next")}>{action === "next" ? "Đang bắt đầu..." : "Bắt đầu chu kỳ mới"}</Button>}</div>
        <div className="grid gap-5 lg:grid-cols-2"><Card className="section-card"><CardContent className="p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Sprout className="size-5 text-primary" />Thông tin chu kỳ</h2><dl className="mt-4 divide-y divide-[#EDF2EE]">{[
          ["Giống cây", detail.supply?.supplyName ?? `Giống #${detail.cycle.supplyId}`],
          ["Khay", detail.tray?.trayCode ?? `Khay #${detail.cycle.soilTrayId}`],
          ["Ngày bắt đầu", date(detail.cycle.startDate)],
          ["Thu hoạch dự kiến", date(detail.cycle.expectedHarvestDate)],
          ["Thu hoạch thực tế", detail.cycle.actualHarvestDate ? date(detail.cycle.actualHarvestDate) : "Chưa thu hoạch"],
          ["Trạng thái", cropStatusLabel(detail.cycle.cropStatus)],
        ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl></CardContent></Card>
        <Card className="section-card"><CardContent className="p-5 sm:p-6"><h2 className="text-lg font-bold">Công việc chăm sóc</h2>{detail.tasks.length ? <div className="mt-4 divide-y divide-[#EDF2EE]">{detail.tasks.map((task) => <div key={task.taskId} className="flex items-start justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{task.taskName}</p><p className="mt-1 text-xs text-muted-foreground">Hạn: {date(task.dueDate)}{task.notes ? ` · ${task.notes}` : ""}</p></div><Badge variant="outline">{task.status}</Badge></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Chưa có công việc cho chu kỳ này.</p>}<div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" disabled={action !== null} onClick={() => void runAction("tasks")}>{action === "tasks" ? "Đang tạo..." : "Tạo công việc theo lịch chăm sóc"}</Button><Button asChild variant="outline"><Link href="/staff/cultivation">Quản lý canh tác</Link></Button></div></CardContent></Card></div></>}
  </div></main>;
}
