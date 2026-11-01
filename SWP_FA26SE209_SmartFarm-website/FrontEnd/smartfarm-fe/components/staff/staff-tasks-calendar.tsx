"use client";

import { CalendarSkeleton } from "@/components/ui/loading-state";

import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TasksPage } from "@/components/tasks/tasks-page";
import { TasksProvider } from "@/components/tasks/tasks-provider";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import type { DailyTask } from "@/lib/api/staff/staff-cultivation-service";
import { toStaffWorkTask } from "@/lib/staff-task-display";

export function StaffTasksCalendar() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setLoading(true); setError(""); } });
    staffCultivationService.tasks()
      .then((data) => { if (!cancelled) setTasks(data); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải công việc chăm sóc."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  if (loading) return <CalendarSkeleton />;
  if (error) return <StatePanel text={error} retry={() => setReloadKey((value) => value + 1)} />;

  const calendarTasks = tasks.map(task => toStaffWorkTask(task));
  return <TasksProvider
    initialTasks={calendarTasks}
    onComplete={async (id) => {
      return toStaffWorkTask(await staffCultivationService.completeTask(Number(id), { status: "COMPLETED", notes: tasks.find(task => String(task.taskId) === id)?.notes || null }));
    }}
    onAssign={async (id, userId) => toStaffWorkTask(await staffCultivationService.assignTask(Number(id), userId))}
  ><TasksPage scope="staff" /></TasksProvider>;
}

function StatePanel({ text, spinning = false, retry }: { text: string; spinning?: boolean; retry?: () => void }) {
  return <main className="grid min-h-[calc(100dvh-80px)] place-items-center bg-white p-6"><div className="text-center"><CalendarDays className="mx-auto size-10 text-primary" /><p className="mt-3 text-sm text-muted-foreground">{text}</p>{retry && <Button variant="outline" className="mt-4" onClick={retry}><RefreshCw className={spinning ? "animate-spin" : ""} />Thử lại</Button>}</div></main>;
}
