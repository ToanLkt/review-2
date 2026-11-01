"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  initialWorkTasks,
  saveTask,
  type TaskDraft,
  type WorkTask,
} from "@/lib/work-schedule";

function useTasksState(initialTasks: WorkTask[], onComplete?: (id: string) => Promise<WorkTask | void>, onAssign?: (id: string, userId: number | null) => Promise<WorkTask>) {
  const [tasks, setTasks] = useState<WorkTask[]>(initialTasks);
  const inFlight = useRef(new Set<string>());
  const [pending, setPending] = useState<string[]>([]);

  function save(draft: TaskDraft, id?: string) {
    const result = saveTask(tasks, draft, id);
    if (Object.keys(result.errors).length) return result.errors;
    setTasks(result.tasks);
    toast.success(
      id ? "Đã cập nhật công việc." : "Đã tạo công việc thành công.",
      {
        description: "Thay đổi chỉ được lưu trong phiên hiện tại.",
      },
    );
    return result.errors;
  }

  async function complete(id: string) {
    if (inFlight.current.has(id)) return false;
    inFlight.current.add(id);
    setPending(list => [...list, id]);
    try {
      const updated = await onComplete?.(id);
      setTasks((list) =>
        list.map((task) =>
          task.id === id ? updated || { ...task, status: "Hoàn thành" } : task,
        ),
      );
      toast.success("Đã đánh dấu công việc hoàn thành.", {
        description: onComplete ? undefined : "Thay đổi chỉ được lưu trong phiên hiện tại.",
      });
      return true;
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể hoàn thành công việc.");
      return false;
    } finally {
      setPending(list => list.filter(value => value !== id));
    }
  }

  async function assign(id: string, userId: number | null) {
    if (!onAssign || inFlight.current.has(id)) return;
    inFlight.current.add(id);
    setPending(list => [...list, id]);
    try {
      const updated = await onAssign(id, userId);
      setTasks(list => list.map(task => task.id === id ? updated : task));
      toast.success(userId ? "Đã phân công công việc." : "Đã bỏ phân công.");
    } finally { inFlight.current.delete(id); setPending(list => list.filter(value => value !== id)); }
  }

  function remove(id: string) {
    setTasks((list) => list.filter((task) => task.id !== id));
    toast.success("Đã xóa công việc.", {
      description: "Thay đổi chỉ được lưu trong phiên hiện tại.",
    });
  }

  return { tasks, save, complete, remove, assign, canAssign: !!onAssign, pending };
}

const TasksContext = createContext<ReturnType<typeof useTasksState> | null>(
  null,
);

export function TasksProvider({
  children,
  initialTasks = initialWorkTasks,
  onComplete,
  onAssign,
}: {
  children: ReactNode;
  initialTasks?: WorkTask[];
  onComplete?: (id: string) => Promise<WorkTask | void>;
  onAssign?: (id: string, userId: number | null) => Promise<WorkTask>;
}) {
  return (
    <TasksContext.Provider value={useTasksState(initialTasks, onComplete, onAssign)}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const value = useContext(TasksContext);
  if (!value) throw new Error("Thiếu dữ liệu lịch công việc");
  return value;
}
