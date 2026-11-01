"use client";
import { Check, Clock3, Droplets, History, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Status } from "./shared";
import { useLiveDashboard } from "./live-dashboard-provider";
import { stamp } from "@/lib/formatters";
import type { Task, Activity } from "@/lib/types";
export function TasksActivity({
  tasks,
  activities,
}: {
  tasks: Task[];
  activities: Activity[];
}) {
  const { completeTask } = useLiveDashboard();
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="section-card">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="section-title">Công việc hôm nay</h2>
            <p className="subtle mt-1">
              {tasks.filter((t) => t.done).length}/{tasks.length} công việc hoàn
              thành · {new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())}
            </p>
          </div>
          <Button
            asChild
            size="icon"
            variant="ghost"
            aria-label="Xem lịch công việc"
          >
            <Link href="/admin/tasks">
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="px-5 pb-3">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-t py-4">
              <span className="flex w-12 shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                <Clock3 className="size-3" />
                {t.time}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-medium ${t.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {t.title}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {t.target} · {t.assignee}
                </p>
              </div>
              <Status>{t.done ? "Hoàn thành" : "Chờ thực hiện"}</Status>
              <Button
                size="icon"
                className="size-7 shrink-0 border border-primary bg-primary text-white hover:bg-[#3F7655] disabled:border-primary/40 disabled:bg-primary/40 disabled:text-white disabled:opacity-100"
                disabled={t.done}
                aria-label={`Hoàn thành: ${t.title}`}
                onClick={() => void completeTask(t.id)}
              >
                <Check className="size-3.5" />
              </Button>
            </div>
          ))}
          {!tasks.length && (
            <p className="subtle py-8 text-center">
              Không có công việc tại khu vực này.
            </p>
          )}
        </div>
      </Card>
      <Card className="section-card">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="section-title">Hoạt động gần đây</h2>
            <p className="subtle mt-1">Nhật ký vận hành theo khoảng ngày</p>
          </div>
          <History className="size-4 text-muted-foreground" />
        </div>
        <div className="space-y-0 px-5 pb-5">
          {activities.slice(0, 6).map((a, i) => (
            <div key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < Math.min(activities.length, 6) - 1 && (
                <span className="absolute top-8 bottom-0 left-4 border-l" />
              )}
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                <Droplets className="size-3.5 text-primary" />
              </span>
              <div className="pt-1">
                <p className="text-xs leading-relaxed">{a.text}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {stamp(a.at)}
                </p>
              </div>
            </div>
          ))}
          {!activities.length && (
            <p className="subtle py-8 text-center">
              Không có hoạt động trong khoảng ngày đã chọn.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
