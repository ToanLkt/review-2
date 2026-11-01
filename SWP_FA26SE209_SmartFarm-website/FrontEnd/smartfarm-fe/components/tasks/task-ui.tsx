"use client";

import type { ReactNode } from "react";
import { Check, Clock3, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  timeLabel,
  type TaskStatus,
  type TaskType,
  type WorkTask,
} from "@/lib/work-schedule";

const categoryStyles: Record<TaskType, string> = {
  "Gieo hạt": "border-violet-200 bg-violet-50 text-violet-800",
  "Chăm sóc": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Kiểm tra môi trường": "border-blue-200 bg-blue-50 text-blue-800",
  "Kiểm tra thiết bị": "border-sky-200 bg-sky-50 text-sky-800",
  "Thu hoạch": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Đóng gói": "border-orange-200 bg-orange-50 text-orange-800",
  "Vệ sinh": "border-amber-200 bg-amber-50 text-amber-800",
  "Bổ sung dinh dưỡng": "border-lime-200 bg-lime-50 text-lime-800",
  Khác: "border-slate-200 bg-slate-50 text-slate-700",
};

export function taskCategoryClass(type: TaskType) {
  return categoryStyles[type];
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    "Hoàn thành": "bg-emerald-50 text-emerald-700",
    "Chờ thực hiện": "bg-amber-50 text-amber-700",
    "Đang thực hiện": "bg-blue-50 text-blue-700",
    "Bỏ qua": "bg-slate-100 text-slate-600",
    "Quá hạn": "bg-red-50 text-red-700",
  };
  const icon: Record<TaskStatus, ReactNode> = {
    "Hoàn thành": <Check className="size-3.5" />,
    "Chờ thực hiện": <Clock3 className="size-3.5" />,
    "Đang thực hiện": <Clock3 className="size-3.5" />,
    "Bỏ qua": <CircleAlert className="size-3.5" />,
    "Quá hạn": <CircleAlert className="size-3.5" />,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        styles[status],
      )}
    >
      {icon[status]}
      {status}
    </span>
  );
}

export function CalendarTask({
  task,
  compact = false,
  onOpen,
}: {
  task: WorkTask;
  compact?: boolean;
  onOpen: (task: WorkTask, trigger: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(task, event.currentTarget)}
      className={cn(
        "w-full rounded-[10px] border p-2 text-left transition hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transform-none",
        categoryStyles[task.type],
        compact && "p-1.5",
      )}
      aria-label={`${timeLabel(task.start)}, ${task.title}, ${task.assignee}`}
    >
      <span className="block text-[11px] font-bold tabular-nums">
        {timeLabel(task.start)}
      </span>
      <span
        className={cn(
          "mt-0.5 block font-semibold leading-4",
          compact ? "line-clamp-1 text-[10px]" : "line-clamp-2 text-[11px]",
        )}
      >
        {task.title}
      </span>
      {!compact && (
        <span className="mt-1 block text-[10px] opacity-75">
          {task.assignee}
        </span>
      )}
    </button>
  );
}
