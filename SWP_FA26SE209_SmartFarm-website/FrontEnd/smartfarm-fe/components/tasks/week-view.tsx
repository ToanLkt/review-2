"use client";

import { cn } from "@/lib/utils";
import { localDateKey, timeLabel, type WorkTask } from "@/lib/work-schedule";
import { taskCategoryClass } from "./task-ui";

const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const hours = Array.from({ length: 12 }, (_, index) => index + 7);

function weekDates(anchor: Date) {
  const referenceStart = new Date(2026, 8, 8, 12);
  const offsetWeeks = Math.round(
    (anchor.getTime() - new Date(2026, 8, 9, 12).getTime()) / 604800000,
  );
  referenceStart.setDate(referenceStart.getDate() + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceStart);
    date.setDate(referenceStart.getDate() + index);
    return date;
  });
}

export function WeekView({
  anchor,
  tasks,
  selectedDate,
  onSelectDate,
  onOpenTask,
}: {
  anchor: Date;
  tasks: WorkTask[];
  selectedDate: string;
  onSelectDate: (date: string, trigger: HTMLElement) => void;
  onOpenTask: (task: WorkTask, trigger: HTMLElement) => void;
}) {
  const dates = weekDates(anchor);
  return (
    <section
      aria-label="Lịch công việc theo tuần"
      className="min-w-[960px] overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3012]"
    >
      <div className="grid grid-cols-[64px_repeat(7,minmax(120px,1fr))] border-b bg-white">
        <div className="border-r" />
        {dates.map((date, index) => {
          const key = localDateKey(date);
          const current = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              onClick={(event) => onSelectDate(key, event.currentTarget)}
              className={cn(
                "flex h-[86px] flex-col items-center justify-center gap-1 border-r text-xs last:border-r-0 hover:bg-[#F8FBF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                current && "bg-[#F3F8F4] text-primary",
              )}
            >
              <span className="font-semibold text-muted-foreground">
                {dayLabels[index]}
              </span>
              <span className="text-sm font-bold">
                {String(date.getDate()).padStart(2, "0")}/
                {String(date.getMonth() + 1).padStart(2, "0")}/{date.getFullYear()}
              </span>
              {current && <span className="size-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="relative grid grid-cols-[64px_repeat(7,minmax(120px,1fr))]">
        <div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-r border-b px-2 pt-1 text-right text-[10px] tabular-nums text-muted-foreground"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {dates.map((date) => {
          const key = localDateKey(date);
          const dateTasks = tasks.filter(
            (task) => localDateKey(task.start) === key,
          );
          return (
            <div key={key} className="relative border-r last:border-r-0">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b" />
              ))}
              {dateTasks.map((task) => {
                const [hour, minute] = timeLabel(task.start)
                  .split(":")
                  .map(Number);
                const [endHour, endMinute] = timeLabel(task.end)
                  .split(":")
                  .map(Number);
                const top = ((hour - 7) * 60 + minute) * (64 / 60);
                const duration = Math.max(
                  30,
                  (endHour - hour) * 60 + endMinute - minute,
                );
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={(event) => onOpenTask(task, event.currentTarget)}
                    style={{
                      top,
                      height: Math.max(42, duration * (64 / 60) - 4),
                    }}
                    className={cn(
                      "absolute right-1 left-1 z-10 overflow-hidden rounded-[9px] border p-1.5 text-left shadow-sm transition hover:z-20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      taskCategoryClass(task.type),
                    )}
                  >
                    <span className="block text-[10px] font-bold tabular-nums">
                      {timeLabel(task.start)}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[10px] font-semibold leading-3.5">
                      {task.title}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
