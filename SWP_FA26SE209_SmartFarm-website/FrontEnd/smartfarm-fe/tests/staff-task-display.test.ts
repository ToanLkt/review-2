import assert from "node:assert/strict";
import test from "node:test";
import { toStaffWorkTask } from "../lib/staff-task-display";
import type { DailyTask } from "../lib/api/staff/staff-cultivation-service";

const task: DailyTask = { taskId: 7, rentalId: 8, assignedUserId: 9, taskName: "Tưới cây", dueDate: "2026-10-01T01:00:00Z", status: "PENDING", completedAt: null, notes: "Kiểm tra đất", assignedUserName: "Nguyễn An", supplyName: "Rau cải", trayCode: "KHAY-A1", orderCode: "DH-001", zoneName: "Khu A" };
const now = Date.parse("2026-10-03T00:00:00Z");
test("skipped tasks are not completed or overdue", () => {
  const result = toStaffWorkTask({ ...task, status: "SKIPPED" }, now);
  assert.equal(result.status, "Bỏ qua");
  assert.equal(result.priority, "Bình thường");
});
test("pending past-due tasks are highlighted with business context", () => {
  const result = toStaffWorkTask(task, now);
  assert.equal(result.status, "Quá hạn");
  assert.equal(result.assignee, "Nguyễn An");
  assert.equal(result.target, "Rau cải · KHAY-A1 · DH-001");
  assert.equal(result.area, "Khu A");
  assert.equal(result.end, result.start);
});
test("completion and unassignment remain distinct", () => {
  const result = toStaffWorkTask({ ...task, status: "COMPLETED", assignedUserId: null, assignedUserName: null }, now);
  assert.equal(result.status, "Hoàn thành");
  assert.equal(result.assignee, "Chưa phân công");
});
test("future pending tasks do not become overdue", () => {
  assert.equal(toStaffWorkTask(task, Date.parse("2026-09-01")).status, "Chờ thực hiện");
});
