"use client";

import { CalendarDays, Check, Clock3 } from "lucide-react";
import { timeLabel, type WorkTask } from "@/lib/work-schedule";

export function TodayTasks({
  tasks,
  onOpenTask,
}: {
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask, trigger: HTMLElement) => void;
}) {
  return (
    <aside className="self-start rounded-2xl border bg-white shadow-[0_1px_4px_#244a3012] xl:sticky xl:top-24">
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
          <CalendarDays className="size-4" />
        </span>
        <h2 className="font-semibold text-[#1F2937]">Công việc hôm nay</h2>
        <span className="ml-auto rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
          {tasks.length}
        </span>
      </header>
      <div className="divide-y px-5">
        {tasks.length ? (
          tasks.map((task) => {
            const completed = task.status === "Hoàn thành";
            return (
              <button
                type="button"
                key={task.id}
                onClick={(event) => onOpenTask(task, event.currentTarget)}
                className="w-full py-4 text-left transition hover:bg-[#F8FBF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
              >
                <div className="flex items-start gap-3">
                  <span className="w-10 shrink-0 text-xs font-bold tabular-nums text-[#1F2937]">
                    {timeLabel(task.start)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5 text-[#1F2937]">
                      {task.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {task.area} · {task.assignee}
                    </span>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${completed ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {completed ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Clock3 className="size-3.5" />
                      )}
                      {completed ? "Hoàn thành" : "Chờ thực hiện"}
                    </span>
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Không có công việc phù hợp.
          </p>
        )}
      </div>
    </aside>
  );
}
