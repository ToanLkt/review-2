import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialVarieties,
  catalogSummary,
  filterVarieties,
  validateVariety,
} from "../lib/varieties";
test("Danh mục bổ sung Lúa mì cho bảng giá, giữ nguyên sáu giống hiện có", () => {
  const s = catalogSummary(initialVarieties);
  assert.equal(s.total, 7);
  assert.equal(s.enabled, 5);
  assert.equal(s.disabled, 2);
  assert.equal(
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
      s.average,
    ),
    "7,9",
  );
  assert.deepEqual(
    initialVarieties
      .slice(0, 4)
      .map((v) => [
        v.name,
        v.code,
        v.referenceGrowthDays,
        v.enabledForNewRentals,
      ]),
    [
      ["Cải xanh", "GR-001", 7, true],
      ["Củ cải trắng", "GR-002", 6, true],
      ["Hướng dương", "GR-003", 9, true],
      ["Đậu Hà Lan", "GR-004", 10, false],
    ],
  );
});
test("Tìm theo tên, mã, mô tả không phân biệt dấu và kết hợp trạng thái", () => {
  assert.equal(
    filterVarieties(initialVarieties, "DAU HA LAN", "disabled").length,
    1,
  );
  assert.equal(
    filterVarieties(initialVarieties, "DAU HA LAN", "enabled").length,
    0,
  );
  assert.equal(filterVarieties(initialVarieties, "gr-002", "").length, 1);
  assert.equal(
    filterVarieties(initialVarieties, "vitamin c", "")[0].name,
    "Củ cải trắng",
  );
  assert.equal(
    filterVarieties(initialVarieties, "khong ton tai", "").length,
    0,
  );
  assert.equal(catalogSummary(initialVarieties).total, 7);
});
test("Kiểm tra tên, mã duy nhất và số ngày nguyên dương", () => {
  const draft = {
    ...initialVarieties[0],
    name: "",
    code: " gr-002 ",
    referenceGrowthDays: 1.5,
  };
  const errors = validateVariety(
    draft,
    initialVarieties,
    initialVarieties[0].id,
  );
  assert.ok(errors.name);
  assert.ok(errors.code);
  assert.ok(errors.referenceGrowthDays);
  for (const days of [0, -1, NaN, Infinity])
    assert.ok(
      validateVariety(
        {
          ...draft,
          name: "Tên mới",
          code: "GR-007",
          referenceGrowthDays: days,
        },
        initialVarieties,
      ).referenceGrowthDays,
    );
  assert.deepEqual(
    validateVariety(
      initialVarieties[0],
      initialVarieties,
      initialVarieties[0].id,
    ),
    {},
  );
});
test("Tổng hợp thay đổi theo danh mục đầy đủ", () => {
  const next = initialVarieties.map((v, i) =>
    i === 0 ? { ...v, enabledForNewRentals: false, referenceGrowthDays: 8 } : v,
  );
  assert.equal(catalogSummary(next).enabled, 4);
  assert.equal(catalogSummary(next).disabled, 3);
  assert.equal(catalogSummary(next).average, 8);
  assert.equal(initialVarieties[0].enabledForNewRentals, true);
});
