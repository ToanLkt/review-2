import test from "node:test";
import assert from "node:assert/strict";
import {
  harvestRecords,
  harvestSummary,
  inDateRange,
  monthlyRevenue,
  reportCsv,
  revenueSummary,
} from "../lib/reports";

test("Doanh thu sáu tháng khớp ba KPI tham chiếu", () => {
  const summary = revenueSummary(monthlyRevenue);
  assert.equal(summary.rental, 61.3);
  assert.equal(summary.retail, 49.7);
  assert.equal(summary.total, 111);
});

test("Lọc loại đơn chỉ giữ đúng nhóm doanh thu", () => {
  const rental = revenueSummary(monthlyRevenue, "Thuê khay");
  const retail = revenueSummary(monthlyRevenue, "Mua hạt giống");
  assert.equal(rental.retail, 0);
  assert.equal(rental.total, 61.3);
  assert.equal(retail.rental, 0);
  assert.equal(retail.total, 49.7);
});

test("Sản lượng tham chiếu có sáu lần, tổng 20,1 kg và chỉ số TB 3,3 kg", () => {
  const summary = harvestSummary(harvestRecords);
  assert.equal(summary.count, 6);
  assert.equal(summary.weight, 20.1);
  assert.equal(summary.average, 3.3);
});

test("Khoảng ngày bao gồm cả hai biên", () => {
  assert.equal(inDateRange("2026-04-01", "2026-04-01", "2026-09-30"), true);
  assert.equal(inDateRange("2026-09-30", "2026-04-01", "2026-09-30"), true);
  assert.equal(inDateRange("2026-10-01", "2026-04-01", "2026-09-30"), false);
});

test("CSV có BOM và tiêu đề đúng theo từng loại báo cáo", () => {
  const revenue = reportCsv("revenue");
  const harvest = reportCsv("harvest");
  const inventory = reportCsv("inventory");
  assert.equal(revenue.charCodeAt(0), 0xfeff);
  assert.match(revenue, /Mã giao dịch/);
  assert.match(harvest, /Khối lượng \(kg\)/);
  assert.match(inventory, /Nhóm vật tư/);
  assert.doesNotMatch(
    reportCsv("revenue", "2026-09-10", "2026-09-10"),
    /GD-5818/,
  );
});
