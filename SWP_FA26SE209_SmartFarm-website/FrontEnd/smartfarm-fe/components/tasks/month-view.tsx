"use client";

import { CalendarTask } from "./task-ui";
import { localDateKey, type WorkTask } from "@/lib/work-schedule";

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function MonthView({
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
  const cells = monthCells(anchor);
  return (
    <section
      aria-label="Lịch công việc theo tháng"
      className="min-w-[820px] overflow-hidden rounded-2xl border bg-white shadow-[0_1px_4px_#244a3012]"
    >
      <div className="grid grid-cols-7 border-b bg-[#F8FBF9]">
        {weekdays.map((day) => (
          <div
            key={day}
            className="px-3 py-3 text-center text-[11px] font-semibold tracking-[.08em] text-[#789482]"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const key = localDateKey(date);
          const dateTasks = tasks.filter(
            (task) => localDateKey(task.start) === key,
          );
          const inMonth = date.getMonth() === anchor.getMonth();
          const selected = key === selectedDate;
          return (
            <div
              key={key}
              className={`min-h-[132px] border-r border-b p-2.5 last:border-r-0 ${selected ? "bg-[#F3F8F4]" : "bg-white"}`}
            >
              <button
                type="button"
                onClick={(event) => onSelectDate(key, event.currentTarget)}
                className={`mb-2 flex size-7 items-center justify-center rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  selected
                    ? "bg-primary text-white"
                    : inMonth
                      ? "text-[#374151] hover:bg-secondary"
                      : "text-slate-300"
                }`}
                aria-label={`Xem công việc ngày ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`}
              >
                {date.getDate()}
              </button>
              <div className="space-y-1.5">
                {dateTasks.slice(0, 2).map((task) => (
                  <CalendarTask
                    key={task.id}
                    task={task}
                    compact
                    onOpen={onOpenTask}
                  />
                ))}
                {dateTasks.length > 2 && (
                  <button
                    type="button"
                    onClick={(event) => onSelectDate(key, event.currentTarget)}
                    className="w-full rounded-md px-1 py-0.5 text-left text-[10px] font-semibold text-primary hover:bg-secondary"
                  >
                    +{dateTasks.length - 2} công việc
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
