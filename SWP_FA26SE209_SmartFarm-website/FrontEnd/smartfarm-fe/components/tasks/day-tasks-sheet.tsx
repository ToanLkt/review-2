"use client";

import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DevicePanel } from "@/components/devices/device-ui";
import { dateTimeLabel, type WorkTask } from "@/lib/work-schedule";
import { TaskStatusBadge } from "./task-ui";

export function DayTasksSheet({
  date,
  tasks,
  canCreate = true,
  onClose,
  onCreate,
  onOpenTask,
  returnFocus,
}: {
  date: string;
  tasks: WorkTask[];
  canCreate?: boolean;
  onClose: () => void;
  onCreate: () => void;
  onOpenTask: (task: WorkTask) => void;
  returnFocus: () => void;
}) {
  const [year, month, day] = date.split("-");
  return (
    <DevicePanel
      title={`Công việc ngày ${day}/${month}/${year}`}
      description={`${tasks.length} công việc trong ngày đã chọn.`}
      onClose={onClose}
      returnFocus={returnFocus}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {canCreate && (
            <Button onClick={onCreate}>
              <Plus /> Tạo công việc
            </Button>
          )}
        </>
      }
    >
      {tasks.length ? (
        <div className="space-y-3">
          {tasks
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((task) => (
              <button
                type="button"
                key={task.id}
                onClick={() => onOpenTask(task)}
                className="w-full rounded-2xl border bg-white p-4 text-left transition hover:border-primary/30 hover:bg-[#F8FBF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1F2937]">{task.title}</p>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {dateTimeLabel(task.start)} – {task.end.slice(11, 16)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {task.target} · {task.assignee}
                    </p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              </button>
            ))}
        </div>
      ) : (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
          <span className="rounded-2xl bg-secondary p-4 text-primary">
            <CalendarDays className="size-6" />
          </span>
          <h3 className="font-semibold">Chưa có công việc</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {canCreate
              ? "Ngày đã chọn chưa có công việc. Bạn có thể tạo mới và phân công ngay."
              : "Bạn chưa được phân công công việc nào trong ngày này."}
          </p>
        </div>
      )}
    </DevicePanel>
  );
}
