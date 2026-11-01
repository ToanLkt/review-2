"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  initialAlerts,
  initialOrders,
  initialTasks,
  initialActivities,
  NOW,
} from "@/lib/mock-data";
import type { FarmAlert, Order } from "@/lib/types";
function useDemoState() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [orders, setOrders] = useState(initialOrders);
  const [tasks, setTasks] = useState(initialTasks);
  const [activities, setActivities] = useState(initialActivities);
  const [read, setRead] = useState<string[]>([]);
  function log(text: string) {
    setActivities((a) => [{ id: `HD-${a.length + 1}`, text, at: NOW }, ...a]);
    toast.success(text, {
      description: "Thay đổi chỉ được lưu trong phiên hiện tại.",
    });
  }
  function updateAlert(id: string, patch: Partial<FarmAlert>) {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    log(`Cảnh báo ${id}: ${patch.status ?? "đã lưu ghi chú"}`);
  }
  function completeTask(id: string) {
    setTasks((a) => a.map((x) => (x.id === id ? { ...x, done: true } : x)));
    log(`Đã hoàn thành công việc ${id}`);
  }
  function fulfill(id: string) {
    const order = orders.find((x) => x.id === id);
    if (
      !order ||
      order.payment !== "Đã xác nhận" ||
      order.status !== "Chờ xử lý"
    )
      return;
    setOrders((a) =>
      a.map((x) =>
        x.id === id ? ({ ...x, status: "Đang xử lý" } as Order) : x,
      ),
    );
    log(`Đã tiếp nhận đơn hàng ${id}`);
  }
  return {
    alerts,
    orders,
    tasks,
    activities,
    read,
    setRead,
    updateAlert,
    completeTask,
    fulfill,
    setOrders,
  };
}
const DemoContext = createContext<ReturnType<typeof useDemoState> | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useDemoState();
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Thiếu ngữ cảnh mô phỏng");
  return ctx;
}
