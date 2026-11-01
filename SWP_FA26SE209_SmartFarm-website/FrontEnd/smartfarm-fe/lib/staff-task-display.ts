import type { DailyTask } from "./api/staff/staff-cultivation-service";
import type { WorkTask } from "./work-schedule";

export function toStaffWorkTask(task: DailyTask, now = Date.now()): WorkTask {
  const overdue = task.status === "PENDING" && new Date(task.dueDate).getTime() < now;
  const date = new Date(task.dueDate);
  const start = Number.isNaN(date.getTime()) ? task.dueDate : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return {
    id: String(task.taskId), title: task.taskName,
    type: task.taskName.toLocaleLowerCase("vi").includes("thu hoạch") ? "Thu hoạch" : "Chăm sóc",
    target: [task.supplyName, task.trayCode, task.orderCode].filter(Boolean).join(" · ") || "Chưa có thông tin cây / khay",
    area: task.zoneName || "Chưa xác định khu vực",
    assignee: task.assignedUserName || (task.assignedUserId ? "Chưa tải được tên nhân viên" : "Chưa phân công"),
    assignedUserId: task.assignedUserId,
    start, end: start,
    priority: overdue ? "Cao" : "Bình thường",
    status: task.status === "SKIPPED" ? "Bỏ qua" : task.status === "COMPLETED" ? "Hoàn thành" : overdue ? "Quá hạn" : "Chờ thực hiện",
    description: task.notes || "",
  };
}
