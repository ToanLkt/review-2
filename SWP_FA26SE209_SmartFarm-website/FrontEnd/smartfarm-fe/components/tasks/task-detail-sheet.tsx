"use client";

import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DevicePanel } from "@/components/devices/device-ui";
import { TaskStatusBadge, taskCategoryClass } from "./task-ui";
import { dateTimeLabel, type WorkTask } from "@/lib/work-schedule";

export function TaskDetailSheet({
  task,
  canManage = true,
  onClose,
  onEdit,
  onComplete,
  onDelete,
  returnFocus,
}: {
  task: WorkTask;
  canManage?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  returnFocus: () => void;
}) {
  return (
    <DevicePanel
      title="Chi tiết công việc"
      description={`${task.id} · ${task.title}`}
      onClose={onClose}
      returnFocus={returnFocus}
      footer={
        <div className="flex w-full flex-wrap justify-between gap-2">
          {canManage && (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 /> Xóa
            </Button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {canManage && (
              <Button variant="outline" onClick={onEdit}>
                <Pencil /> Chỉnh sửa
              </Button>
            )}
            {task.status !== "Hoàn thành" && (
              <Button onClick={onComplete}>
                <Check /> Đánh dấu hoàn thành
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border bg-[#F8FBF9] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">{task.title}</h2>
              <Badge
                variant="outline"
                className={`mt-2 border ${taskCategoryClass(task.type)}`}
              >
                {task.type}
              </Badge>
            </div>
            <TaskStatusBadge status={task.status} />
          </div>
        </div>

        <section aria-labelledby="task-information" className="space-y-4">
          <h3
            id="task-information"
            className="text-xs font-semibold tracking-[.1em] text-[#789482]"
          >
            THÔNG TIN CÔNG VIỆC
          </h3>
          <dl className="grid gap-3 rounded-2xl border p-4 text-sm">
            <Detail
              icon={<MapPin />}
              label="Khu vực / Lô trồng"
              value={task.target}
            />
            <Detail
              icon={<UserRound />}
              label="Người phụ trách"
              value={task.assignee}
            />
            <Detail
              icon={<CalendarDays />}
              label="Bắt đầu"
              value={dateTimeLabel(task.start)}
            />
            <Detail
              icon={<Clock3 />}
              label="Kết thúc"
              value={dateTimeLabel(task.end)}
            />
            <Detail
              icon={<AlertTriangle />}
              label="Mức độ ưu tiên"
              value={task.priority}
            />
          </dl>
        </section>

        <section aria-labelledby="task-description-title" className="space-y-2">
          <h3
            id="task-description-title"
            className="text-xs font-semibold tracking-[.1em] text-[#789482]"
          >
            MÔ TẢ
          </h3>
          <p className="rounded-2xl bg-[#F3F8F4] p-4 text-sm leading-6 text-muted-foreground">
            {task.description || "Chưa có mô tả cho công việc này."}
          </p>
        </section>
      </div>
    </DevicePanel>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-2 border-b pb-3 last:border-0 last:pb-0">
      <span className="mt-0.5 text-primary [&_svg]:size-4">{icon}</span>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-medium text-[#1F2937]">{value}</dd>
      </div>
    </div>
  );
}
