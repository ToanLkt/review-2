"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Choice } from "@/components/operations/shared/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  localDateKey,
  taskAreas,
  taskAssignees,
  type WorkTask,
} from "@/lib/work-schedule";
import { useTasks } from "./tasks-provider";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { TodayTasks } from "./today-tasks";
import { TaskList } from "./task-list";

const TaskFormSheet = dynamic(
  () => import("./task-form-sheet").then((module) => module.TaskFormSheet),
  { loading: PanelLoading },
);
const TaskDetailSheet = dynamic(
  () => import("./task-detail-sheet").then((module) => module.TaskDetailSheet),
  { loading: PanelLoading },
);
const DayTasksSheet = dynamic(
  () => import("./day-tasks-sheet").then((module) => module.DayTasksSheet),
  { loading: PanelLoading },
);

type ViewMode = "month" | "week" | "list";
type Panel =
  | { mode: "create"; date: string }
  | { mode: "detail" | "edit"; taskId: string }
  | { mode: "day"; date: string }
  | null;

function PanelLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải bảng thông tin"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] space-y-6 border-l bg-white p-8"
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function weekNumber(date: Date) {
  const current = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil(((current.getTime() - start.getTime()) / 86400000 + 1) / 7);
}

export function TasksPage({
  scope = "admin",
}: {
  scope?: "admin" | "staff";
}) {
  const { tasks, complete, remove } = useTasks();
  const isStaff = scope === "staff";
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [assignee, setAssignee] = useState("");
  const [area, setArea] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [deleteTask, setDeleteTask] = useState<WorkTask | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const createButton = useRef<HTMLButtonElement | null>(null);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!assignee || task.assignee === assignee) &&
          (!area || task.area === area),
      ),
    [tasks, assignee, area],
  );
  const todayTasks = filteredTasks.filter(
    (task) => localDateKey(task.start) === localDateKey(new Date()),
  );
  const selectedTask =
    panel && "taskId" in panel
      ? tasks.find((task) => task.id === panel.taskId)
      : undefined;
  const dayTasks =
    panel?.mode === "day"
      ? filteredTasks.filter((task) => localDateKey(task.start) === panel.date)
      : [];

  function remember(element?: HTMLElement | null) {
    trigger.current = element ?? (document.activeElement as HTMLElement);
  }
  function restoreFocus() {
    (trigger.current ?? createButton.current)?.focus();
  }
  function openTask(task: WorkTask, element?: HTMLElement) {
    remember(element);
    setPanel({ mode: "detail", taskId: task.id });
  }
  function openCreate(date = selectedDate, element?: HTMLElement) {
    remember(element ?? createButton.current);
    setPanel({ mode: "create", date });
  }
  function openDate(date: string, element: HTMLElement) {
    setSelectedDate(date);
    remember(element);
    setPanel({ mode: "day", date });
  }
  function movePeriod(direction: -1 | 1) {
    const next = new Date(anchor);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction * 7);
    setAnchor(next);
  }
  function resetToday() {
    const today = new Date();
    setAnchor(today);
    setSelectedDate(localDateKey(today));
  }
  const periodLabel =
    view === "month"
      ? `Tháng ${anchor.getMonth() + 1}, ${anchor.getFullYear()}`
      : `Tuần ${weekNumber(anchor)}, ${anchor.getFullYear()}`;

  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[#1F2937]">
              Lịch công việc
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {isStaff
                ? "Theo dõi lịch công việc được phân công cho bạn."
                : "Sắp xếp và theo dõi công việc chăm sóc nông trại."}
            </p>
          </div>
          {!isStaff && (
            <Button
              ref={createButton}
              className="h-11 rounded-xl px-5"
              onClick={(event) => openCreate(selectedDate, event.currentTarget)}
            >
              <Plus /> Tạo công việc
            </Button>
          )}
        </header>

        <section
          aria-label="Điều khiển lịch"
          className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-[0_1px_3px_#244a3008] xl:flex-row xl:items-center"
        >
          <div className="inline-flex self-start rounded-xl border bg-white p-1">
            {(
              [
                ["month", "Tháng", CalendarDays],
                ["week", "Tuần", CalendarDays],
                ["list", "Danh sách", List],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${view === value ? "bg-primary text-white" : "text-[#4B5563] hover:bg-secondary"}`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              className="h-9 rounded-xl"
              onClick={resetToday}
            >
              Hôm nay
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl"
              aria-label="Kỳ trước"
              onClick={() => movePeriod(-1)}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-0 flex-1 text-center text-sm font-semibold whitespace-nowrap text-[#1F2937] sm:min-w-36">
              {periodLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl"
              aria-label="Kỳ sau"
              onClick={() => movePeriod(1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:ml-auto">
            {!isStaff && (
              <div className="w-full sm:w-48">
                <Choice
                  label="Nhân viên"
                  value={assignee}
                  onChange={setAssignee}
                  options={[
                    { value: "", label: "Tất cả nhân viên" },
                    ...taskAssignees.map((value) => ({ value, label: value })),
                  ]}
                />
              </div>
            )}
            <div className="w-full sm:w-44">
              <Choice
                label="Khu vực"
                value={area}
                onChange={setArea}
                options={[
                  { value: "", label: "Tất cả khu vực" },
                  ...taskAreas
                    .filter((value) => value !== "Tất cả")
                    .map((value) => ({ value, label: value })),
                ]}
              />
            </div>
          </div>
        </section>

        {view === "list" ? (
          <TaskList
            tasks={filteredTasks}
            canEdit={!isStaff}
            showAssigneeFilter={!isStaff}
            onOpenTask={openTask}
            onEditTask={(task, element) => {
              remember(element);
              setPanel({ mode: "edit", taskId: task.id });
            }}
            onCompleteTask={(task) => complete(task.id)}
          />
        ) : (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0 overflow-x-auto pb-1">
              {view === "month" ? (
                <MonthView
                  anchor={anchor}
                  tasks={filteredTasks}
                  selectedDate={selectedDate}
                  onSelectDate={openDate}
                  onOpenTask={openTask}
                />
              ) : (
                <WeekView
                  anchor={anchor}
                  tasks={filteredTasks}
                  selectedDate={selectedDate}
                  onSelectDate={openDate}
                  onOpenTask={openTask}
                />
              )}
            </div>
            <TodayTasks tasks={todayTasks} onOpenTask={openTask} />
          </div>
        )}
      </div>

      {!isStaff && panel?.mode === "create" && (
        <TaskFormSheet
          defaultDate={panel.date}
          onClose={() => setPanel(null)}
          returnFocus={restoreFocus}
        />
      )}
      {!isStaff && panel?.mode === "edit" && selectedTask && (
        <TaskFormSheet
          task={selectedTask}
          onClose={() => setPanel(null)}
          returnFocus={restoreFocus}
        />
      )}
      {panel?.mode === "detail" && selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          canManage={!isStaff}
          onClose={() => setPanel(null)}
          onEdit={() => setPanel({ mode: "edit", taskId: selectedTask.id })}
          onComplete={() => {
            complete(selectedTask.id);
            setPanel(null);
          }}
          onDelete={() => setDeleteTask(selectedTask)}
          returnFocus={restoreFocus}
        />
      )}
      {panel?.mode === "day" && (
        <DayTasksSheet
          date={panel.date}
          tasks={dayTasks}
          canCreate={!isStaff}
          onClose={() => setPanel(null)}
          onCreate={() => setPanel({ mode: "create", date: panel.date })}
          onOpenTask={(task) => setPanel({ mode: "detail", taskId: task.id })}
          returnFocus={restoreFocus}
        />
      )}

      {!isStaff && (
        <AlertDialog
          open={!!deleteTask}
          onOpenChange={(open) => !open && setDeleteTask(null)}
        >
          <AlertDialogContent className="rounded-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa công việc?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa “{deleteTask?.title}”? Hành động này không
              thể hoàn tác trong phiên hiện tại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTask) remove(deleteTask.id);
                setDeleteTask(null);
                setPanel(null);
              }}
            >
              Xóa công việc
            </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  );
}
