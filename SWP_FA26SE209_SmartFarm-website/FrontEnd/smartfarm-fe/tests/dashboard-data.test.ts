import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trays,
  devices,
  initialOrders,
  initialAlerts,
  initialTasks,
  initialActivities,
} from "../lib/mock-data";
import {
  snapshot,
  filterTrays,
  filteredOrders,
  dashboardCsv,
} from "../lib/dashboard-data";
test("KPI được tính từ cùng dữ liệu danh sách", () => {
  assert.deepEqual(snapshot(trays, devices, initialOrders, "Tất cả khu vực"), {
    capacity: 40,
    rented: 32,
    empty: 8,
    harvest: 6,
    online: 18,
    devices: 20,
    offline: 2,
    pending: 12,
    rental: 7,
    retail: 5,
  });
  const c = snapshot(
    trays.filter((t) => t.area === "Khu C"),
    devices.filter((d) => d.area === "Khu C"),
    initialOrders,
    "Khu C",
  );
  assert.equal(c.rented, 8);
  assert.equal(c.capacity, 12);
  assert.equal(c.offline, 2);
  assert.equal(c.pending, 12);
});
test("Đơn mua hạt giống không mang dữ liệu canh tác; tổng tiền khớp sản phẩm", () => {
  for (const o of initialOrders) {
    if (o.kind === "retail") {
      assert.equal("trayIds" in o, false);
      assert.equal("batches" in o, false);
      assert.equal("area" in o, false);
      assert.equal(
        o.total,
        o.products.reduce((s, p) => s + p.quantity * p.price, 0),
      );
    } else {
      for (const id of o.trayIds) {
        const t = trays.find((t) => t.id === id)!;
        assert.equal(t.orderId, o.id);
        assert.equal(t.customer, o.customer);
      }
      assert.deepEqual(
        o.batches.flatMap((b) => b.trayIds).sort(),
        [...o.trayIds].sort(),
      );
    }
  }
});
test("Bộ lọc ngày, loại đơn và tìm kiếm tiếng Việt độc lập", () => {
  assert.equal(filterTrays(trays, "KH-C01", "Tất cả giai đoạn").length, 1);
  assert.ok(filterTrays(trays, "nguyen hoang", "Tất cả giai đoạn").length > 0);
  assert.equal(filterTrays(trays, "KH-C01", "Sẵn sàng thu hoạch").length, 0);
  assert.equal(
    filteredOrders(
      initialOrders,
      "retail",
      new Date(2026, 8, 13),
      new Date(2026, 8, 13),
    ).length,
    2,
  );
  assert.equal(
    filteredOrders(
      initialOrders,
      "all",
      new Date(2026, 7, 1),
      new Date(2026, 7, 2),
    ).length,
    0,
  );
});
test("CSV có BOM, bộ lọc, escape và chống công thức từ dữ liệu nhập", () => {
  const selected = trays.filter((t) => t.area === "Khu A");
  const csv = dashboardCsv({
    area: "Khu A",
    period: "09–15/09/2026",
    trays: selected,
    devices: [],
    alerts: [{ ...initialAlerts[0], notes: '=SUM(1,2)\n"ghi chú"' }],
    orders: [],
    tasks: initialTasks,
    activities: initialActivities,
    metrics: snapshot(selected, [], initialOrders, "Khu A"),
  });
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.includes("KH-A01"));
  assert.ok(!csv.includes("KH-C01"));
  assert.ok(csv.includes("'=SUM(1,2)"));
  assert.ok(csv.includes('""ghi chú""'));
});
