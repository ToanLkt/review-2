import test from "node:test";
import assert from "node:assert/strict";
import {
  filterAlerts,
  initialAlerts,
  isResolvedToday,
  processingMinutes,
  type AlertFilters,
} from "../lib/alerts";

const todayFilters: AlertFilters = {
  search: "",
  severity: "ALL",
  area: "ALL",
  category: "ALL",
  date: "today",
  status: "ALL",
};

test("Dữ liệu cảnh báo có đủ 28 bản ghi và đúng ba chỉ số ban đầu", () => {
  assert.equal(initialAlerts.length, 28);
  assert.equal(
    initialAlerts.filter((alert) => alert.status === "UNRESOLVED").length,
    3,
  );
  assert.equal(
    initialAlerts.filter((alert) => alert.status === "IN_PROGRESS").length,
    2,
  );
  assert.equal(initialAlerts.filter(isResolvedToday).length, 8);
});

test("Thời gian xử lý trung bình của cảnh báo đã giải quyết hôm nay là 18 phút", () => {
  const durations = initialAlerts
    .filter(isResolvedToday)
    .map(processingMinutes)
    .filter((value): value is number => value !== undefined);
  assert.equal(
    Math.round(
      durations.reduce((total, value) => total + value, 0) / durations.length,
    ),
    18,
  );
});

test("Tab chưa xử lý và bộ lọc hôm nay giữ đúng ba cảnh báo", () => {
  const result = filterAlerts(initialAlerts, "UNRESOLVED", todayFilters);
  assert.deepEqual(
    result.map((alert) => alert.id),
    ["ALT-028", "ALT-027", "ALT-026"],
  );
});

test("Tìm kiếm kết hợp đúng với khu vực và mức độ", () => {
  const result = filterAlerts(initialAlerts, "ALL", {
    ...todayFilters,
    date: "30days",
    search: "thiet bi mat ket noi",
    area: "Khu C",
    severity: "CRITICAL",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "ALT-027");
});

test("Khoảng ngày tùy chỉnh bao gồm cả hai biên", () => {
  const result = filterAlerts(initialAlerts, "ALL", {
    ...todayFilters,
    date: "custom",
    from: "2026-09-08",
    to: "2026-09-08",
  });
  assert.equal(result.length, 3);
  assert.ok(result.every((alert) => alert.detectedAt.startsWith("2026-09-08")));
});
