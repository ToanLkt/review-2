import { test } from "node:test";
import assert from "node:assert/strict";
import { environmentView, environmentMeasurements, environmentDevices, measurementStatus, measurementValue } from "../lib/environment";
test("Giám sát: bảy chỉ số theo đúng thứ tự, bốn hiện tại, một cũ, hai ngoại tuyến", () => {
  const view = environmentView();
  assert.deepEqual(view.counts, { current: 4, stale: 1, offline: 2 });
  assert.deepEqual(view.measurements.map(m => m.deviceId), ["TB-A01", "TB-A02", "TB-B01", "TB-B03", "TB-B04", "TB-C02", "TB-C03"]);
  assert.equal(view.areas[0].online, 3);
  assert.equal(view.measurements.filter(m => m.deviceId.startsWith("TB-A")).length, 2);
  assert.equal(view.areas[1].online, 3);
  assert.equal(view.areas[1].stale, 1);
});
test("Bộ lọc kết hợp giữ tổng thiết bị toàn khu và chỉ cảnh báo liên quan", () => {
  const stale = environmentView("B", "TB-B01");
  assert.equal(stale.measurements.length, 1);
  assert.equal(stale.alerts.length, 1);
  assert.deepEqual(stale.counts, { current: 0, stale: 1, offline: 0 });
  assert.equal(stale.areas[0].total, 3);
  const offline = environmentView("C");
  assert.equal(offline.alerts.length, 1);
  assert.deepEqual(offline.alerts[0].deviceIds, ["TB-C02", "TB-C03"]);
  assert.deepEqual(environmentView("", "TB-C02").alerts[0].deviceIds, ["TB-C02"]);
  const noCard = environmentView("A", "TB-A03");
  assert.equal(noCard.measurements.length, 0);
  assert.equal(noCard.areas[0].total, 3);
  assert.equal(noCard.alerts.length, 0);
});
test("Độ mới độc lập với kết nối, dữ liệu thiếu không trở thành số không", () => {
  const m = environmentMeasurements[2], d = environmentDevices.find(d => d.id === m.deviceId)!;
  assert.equal(d.connection, "online");
  assert.equal(measurementStatus(m, d), "stale");
  assert.equal(measurementValue(m, d), "38 %");
  assert.equal(measurementValue({ ...m, value: null }, d), "—");
  assert.equal(measurementValue(m, { ...d, connection: "offline" }), "—");
  assert.equal(measurementValue({ ...m, value: 0 }, d), "0 %");
  assert.equal(measurementValue({ ...m, metric: "waterLevel", levelState: "Mực nước thấp", value: null }, d), "Mực nước thấp");
});
