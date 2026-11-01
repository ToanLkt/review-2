"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { loadDashboardSnapshot, todayKey, zoneForTray, type DashboardSnapshot, type DashboardDevice } from "@/lib/dashboard-live-data";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import type { Activity, FarmAlert, Order, Task, Tray } from "@/lib/types";

type DashboardContextValue = {
  raw: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  updated: string | null;
  refresh: () => Promise<void>;
  areas: string[];
  capacityByArea: Record<string, number>;
  trays: Tray[];
  devices: DashboardDevice[];
  alerts: FarmAlert[];
  orders: Order[];
  tasks: Task[];
  activities: Activity[];
  completeTask: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  fulfill: (id: string) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function orderStatus(value: string): Order["status"] {
  if (value === "COMPLETED") return "Hoàn tất";
  if (value === "EXPIRED" || value === "CANCELLED") return "Đã hủy";
  if (value === "AWAITING_PAYMENT" || value === "CONFIRMED") return "Chờ xử lý";
  return "Đang xử lý";
}

export function LiveDashboardProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRaw(await loadDashboardSnapshot("admin"));
      setUpdated(new Date().toISOString());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);

  const zones = raw?.zones.filter((zone) => zone.isActive) ?? [];
  const areas = zones.map((zone) => zone.zoneName);
  const capacityByArea = Object.fromEntries(zones.map((zone) => [zone.zoneName, zone.trayCount]));
  const trays: Tray[] = (raw?.cycles ?? []).filter((cycle) => !["HARVESTED", "FAILED"].includes(cycle.cropStatus)).flatMap((cycle) => {
    const tray = raw?.trays.find((item) => item.soilTrayId === cycle.soilTrayId);
    if (!tray || tray.currentStatus !== "RENTED") return [];
    const order = raw?.orders.find((item) => item.rentals.some((rental) => rental.trayRentalId === cycle.rentalId));
    const stage: Tray["stage"] = cycle.cropStatus === "READY_TO_HARVEST" || cycle.cropStatus === "HARVESTED"
      ? "Sẵn sàng thu hoạch" : cycle.cropStatus === "PLANTED" || cycle.cropStatus === "GERMINATING"
        ? "Ươm mầm" : "Đang phát triển";
    return [{
      id: tray.trayCode, area: zoneForTray(raw!, tray.soilTrayId), customer: order?.customerName ?? "—",
      seed: order?.items.find((item) => item.supplyId === cycle.supplyId)?.supplyName ?? "—",
      sowed: cycle.startDate, harvest: cycle.expectedHarvestDate, stage,
      health: raw?.alerts.some((alert) => !alert.isResolved && alert.rentalId === cycle.rentalId) ? "Cần kiểm tra" as const : "Bình thường" as const,
      orderId: order?.orderCode ?? "—", cycle: `${cycle.currentCycle}/${cycle.totalCycles}`,
    }];
  });
  const devices: DashboardDevice[] = (raw?.devices ?? []).filter((device) => device.status !== "INACTIVE").map((device) => {
    const assignment = raw?.assignments.find((item) => item.deviceId === device.deviceId);
    const reading = raw?.latest[device.deviceId];
    return {
      id: device.deviceCode, deviceId: device.deviceId, trayId: assignment?.soilTrayId,
      area: assignment ? zoneForTray(raw!, assignment.soilTrayId) : "Chưa xác định",
      online: device.status === "ONLINE" && !reading?.isStale,
      received: reading?.recordedAt ?? device.lastSeen ?? "",
      temperature: reading?.temperature ?? null, humidity: reading?.airHumidity ?? null,
      light: reading?.lightIntensity ?? null, soilHumidity: reading?.soilHumidity ?? null,
      waterLevel: reading?.waterLevel ?? null,
    };
  });
  const alerts: FarmAlert[] = (raw?.alerts ?? []).map((alert) => {
    const device = raw?.devices.find((item) => item.deviceId === alert.deviceId);
    const assignment = raw?.assignments.find((item) => item.deviceId === alert.deviceId);
    return {
      id: String(alert.alertId), title: alert.message, description: alert.message,
      area: assignment ? zoneForTray(raw!, assignment.soilTrayId) : "Chưa xác định",
      device: device?.deviceCode ?? "—", reading: alert.alertType,
      detected: alert.createdAt, severity: alert.severity.toUpperCase() === "CRITICAL" || alert.severity.toUpperCase() === "HIGH" ? "error" : "warning",
      status: alert.isResolved ? "Đã giải quyết" : "Chưa xử lý", assignee: "—", notes: "",
    };
  });
  const orders: Order[] = (raw?.orders ?? []).map((order) => {
    const base = {
      id: order.orderCode, customer: order.customerName, total: order.totalAmount,
      payment: order.status === "AWAITING_PAYMENT" ? "Chờ thanh toán" as const : order.status === "EXPIRED" ? "Thanh toán thất bại" as const : "Đã xác nhận" as const,
      status: orderStatus(order.status), created: order.createdAt,
    };
    return order.orderType === "TRAY_RENTAL"
      ? { ...base, kind: "rental" as const, trayIds: order.rentals.map((rental) => rental.trayCode), batches: (raw?.deliveries ?? []).filter((delivery) => delivery.orderId === order.orderId).map((delivery) => ({
        id: String(delivery.deliveryId),
        trayIds: order.rentals.filter((rental) => rental.trayRentalId === delivery.rentalId).map((rental) => rental.trayCode),
        date: delivery.deliveredAt ?? delivery.scheduledDeliveryAt ?? order.createdAt,
        status: delivery.status === "DELIVERED" ? "Đã giao" as const : ["PACKAGED", "SHIPPING"].includes(delivery.status) ? "Chờ giao" as const : "Đang trồng" as const,
      })) }
      : { ...base, kind: "retail" as const, products: order.items.map((item) => ({ name: item.supplyName, quantity: item.quantity, price: item.unitPrice })), shipping: order.shippingAddress ?? "—" };
  });
  const tasks: Task[] = (raw?.tasks ?? []).filter((task) => todayKey(task.dueDate) === todayKey(new Date())).map((task) => {
    const cycle = raw?.cycles.find((item) => item.rentalId === task.rentalId);
    const tray = raw?.trays.find((item) => item.soilTrayId === cycle?.soilTrayId);
    return {
      id: String(task.taskId), time: task.dueDate ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(task.dueDate)) : "—",
      title: task.taskName, area: tray ? zoneForTray(raw!, tray.soilTrayId) : "Chưa xác định",
      target: tray?.trayCode ?? "—", assignee: task.assignedUserName ?? "Chưa phân công", done: task.status === "COMPLETED",
    };
  });
  const activities: Activity[] = [
    ...(raw?.alerts ?? []).map((item) => ({ id: `alert-${item.alertId}`, text: item.message, at: item.createdAt })),
    ...(raw?.tasks ?? []).filter((item) => item.completedAt).map((item) => ({ id: `task-${item.taskId}`, text: `Hoàn thành: ${item.taskName}`, at: item.completedAt! })),
    ...(raw?.orders ?? []).map((item) => ({ id: `order-${item.orderId}`, text: `Đơn hàng ${item.orderCode} được tạo`, at: item.createdAt })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  async function completeTask(id: string) {
    try { await staffCultivationService.completeTask(Number(id), { status: "COMPLETED", notes: null }); await refresh(); toast.success("Đã hoàn thành công việc."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Không hoàn thành được công việc."); }
  }
  async function resolveAlert(id: string) {
    try { await staffIoTService.resolveAlert(Number(id)); await refresh(); toast.success("Đã giải quyết cảnh báo."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Không xử lý được cảnh báo."); }
  }
  async function fulfill(id: string) {
    const order = raw?.orders.find((item) => item.orderCode === id);
    if (!order) return;
    try { await staffOrdersService.updateStatus(order.orderId, "PREPARING"); await refresh(); toast.success("Đã tiếp nhận đơn hàng."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Không tiếp nhận được đơn hàng."); }
  }

  return <DashboardContext.Provider value={{ raw, loading, error, updated, refresh, areas, capacityByArea, trays, devices, alerts, orders, tasks, activities, completeTask, resolveAlert, fulfill }}>{children}</DashboardContext.Provider>;
}

export function useLiveDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("Thiếu dữ liệu dashboard.");
  return value;
}
