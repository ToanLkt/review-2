import test from "node:test";
import assert from "node:assert/strict";
import {
  filterOperationLogs,
  initialEnvironmentThresholds,
  operationLogs,
  validatePasswordChange,
  validateThresholds,
} from "../lib/settings";

test("Nhật ký cài đặt có dữ liệu cố định và lọc đúng trong ngày", () => {
  const result = filterOperationLogs(operationLogs, {
    search: "",
    user: "",
    action: "",
    period: "today",
  });
  assert.equal(operationLogs.length, 10);
  assert.equal(result.length, 4);
  assert.ok(result.every((log) => log.occurredAt.startsWith("2026-09-09")));
});

test("Tìm nhật ký không phân biệt dấu và kết hợp người thực hiện", () => {
  const result = filterOperationLogs(operationLogs, {
    search: "nguong do am gia the",
    user: "Nguyễn Minh",
    action: "Cập nhật",
    period: "30days",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "LOG-010");
});

test("Ngưỡng môi trường mặc định hợp lệ và chặn khoảng đảo ngược", () => {
  assert.equal(validateThresholds(initialEnvironmentThresholds), undefined);
  assert.match(
    validateThresholds({
      ...initialEnvironmentThresholds,
      temperatureMin: "30",
      temperatureMax: "20",
    }) ?? "",
    /tối thiểu.*nhỏ hơn/i,
  );
});

test("Đổi mật khẩu kiểm tra trường bắt buộc, độ dài và xác nhận", () => {
  assert.deepEqual(
    validatePasswordChange({ current: "", next: "123", confirm: "456" }),
    {
      current: "Vui lòng nhập mật khẩu hiện tại.",
      next: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      confirm: "Mật khẩu xác nhận không khớp.",
    },
  );
  assert.deepEqual(
    validatePasswordChange({
      current: "old-password",
      next: "new-password",
      confirm: "new-password",
    }),
    {},
  );
});
