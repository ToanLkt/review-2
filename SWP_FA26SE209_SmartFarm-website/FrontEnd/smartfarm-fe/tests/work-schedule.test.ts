import test from "node:test";
import assert from "node:assert/strict";
import {
  initialWorkTasks,
  normalizeTaskText,
  saveTask,
  validateTask,
} from "../lib/work-schedule";

test("Ngày tham chiếu có đúng bốn công việc hôm nay", () => {
  const today = initialWorkTasks.filter((task) =>
    task.start.startsWith("2026-09-09"),
  );
  assert.equal(today.length, 4);
  assert.equal(today.filter((task) => task.status === "Hoàn thành").length, 2);
  assert.equal(
    today.filter((task) => task.status === "Chờ thực hiện").length,
    2,
  );
});

test("Tìm kiếm công việc không phân biệt dấu và chữ hoa", () => {
  assert.equal(
    normalizeTaskText("Kiểm tra môi trường").includes(
      normalizeTaskText("KIEM TRA MOI"),
    ),
    true,
  );
});

test("Biểu mẫu bắt buộc nội dung chính và giờ kết thúc hợp lệ", () => {
  const errors = validateTask({
    title: "",
    type: "Chăm sóc",
    target: "",
    area: "Khu A",
    assignee: "Minh Anh",
    start: "2026-09-09T09:00",
    end: "2026-09-09T08:00",
    priority: "Bình thường",
    description: "",
  });
  assert.ok(errors.title);
  assert.ok(errors.target);
  assert.ok(errors.end);
});

test("Tạo công việc sinh mã tiếp theo và không sửa dữ liệu ban đầu", () => {
  const before = structuredClone(initialWorkTasks);
  const result = saveTask(initialWorkTasks, {
    title: "  Kiểm tra khu C  ",
    type: "Kiểm tra môi trường",
    target: "  Khu C / Kệ C1  ",
    area: "Khu C",
    assignee: "Thanh Hà",
    start: "2026-09-14T08:00",
    end: "2026-09-14T09:00",
    priority: "Bình thường",
    description: "Kiểm tra đầu ngày",
  });
  assert.deepEqual(initialWorkTasks, before);
  assert.equal(Object.keys(result.errors).length, 0);
  assert.equal(result.tasks.at(-1)?.id, "CV-013");
  assert.equal(result.tasks.at(-1)?.title, "Kiểm tra khu C");
  assert.equal(result.tasks.at(-1)?.status, "Chờ thực hiện");
});
