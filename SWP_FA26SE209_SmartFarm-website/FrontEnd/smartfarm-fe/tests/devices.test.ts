import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialDevices,
  deviceSummary,
  deviceReading,
  deviceTimestamp,
  commandGuard,
  controllers,
  validateDevice,
  deviceEnvironmentView,
  type DeviceDraft,
} from "../lib/devices";
import {
  environmentDevices,
  environmentMeasurements,
} from "../lib/environment";

test("Thiết bị: giữ 40 bản ghi cũ và thêm cảm biến/đèn C1 ngoại tuyến cho tự động hóa", () => {
  assert.deepEqual(deviceSummary(initialDevices), {
    total: 42,
    online: 38,
    offline: 4,
    unregistered: 0,
    types: 5,
    controllers: 3,
  });
  assert.equal(initialDevices.filter((d) => d.group === "sensor").length, 29);
  assert.equal(initialDevices.filter((d) => d.group === "actuator").length, 13);
  assert.equal(new Set(initialDevices.map((d) => d.id)).size, 42);
  assert.deepEqual(
    initialDevices.slice(-2).map((d) => d.id),
    ["TB-C05", "DK-C01"],
  );
  assert.ok(initialDevices.slice(-2).every((d) => d.connection === "offline"));
  assert.deepEqual(
    initialDevices.slice(0, 7).map((d) => d.id),
    ["TB-A01", "TB-A02", "TB-A05", "TB-B03", "TB-B04", "TB-C02", "TB-C03"],
  );
  for (const d of initialDevices.filter((d) => d.connection === "online"))
    assert.equal(
      controllers.find((c) => c.id === d.controllerId)?.connection,
      "online",
    );
});
test("Mã dùng chung giữ nguyên số đo và kết nối, không biến dữ liệu thiếu thành 0", () => {
  for (const d of environmentDevices) {
    const shared = initialDevices.find((x) => x.id === d.id)!;
    assert.equal(shared.connection, d.connection);
    assert.deepEqual(
      shared.reading,
      environmentMeasurements.find((m) => m.deviceId === d.id),
    );
  }
  assert.equal(deviceReading(initialDevices[0]), "24.5 °C");
  assert.equal(deviceReading(initialDevices[3]), "11.800 lux");
  assert.equal(deviceReading(initialDevices[5]), "Không có dữ liệu");
  const d = initialDevices[4];
  assert.equal(
    deviceReading({
      ...d,
      reading: { ...d.reading!, value: null, levelState: "Mực nước thấp" },
    }),
    "Mực nước thấp",
  );
  assert.equal(deviceReading({ ...d, reading: undefined }), "Không có dữ liệu");
  assert.equal(deviceTimestamp(initialDevices[0].lastContact), "10/09 14:32");
});
test("Đăng ký kiểm tra mã duy nhất, nhóm/loại, vị trí và ESP32", () => {
  const draft: DeviceDraft = {
    id: "TB-NEW",
    name: "Cảm biến mới",
    group: "sensor",
    type: "temperature",
    area: "A",
    location: "Kệ 1",
    controllerId: "ESP32-A",
    notes: "",
  };
  assert.deepEqual(validateDevice(draft, initialDevices), {});
  assert.ok(validateDevice({ ...draft, id: " tb-a01 " }, initialDevices).id);
  assert.ok(validateDevice({ ...draft, name: " " }, initialDevices).name);
  assert.ok(validateDevice({ ...draft, type: "pump" }, initialDevices).type);
  assert.ok(
    validateDevice({ ...draft, location: "Kệ 9" }, initialDevices).location,
  );
  assert.ok(
    validateDevice({ ...draft, controllerId: "ESP32-B" }, initialDevices)
      .controllerId,
  );
});
test("Điều khiển chặn ngoại tuyến, lệnh trùng, tự động và thời gian bơm không hợp lệ", () => {
  const d = initialDevices.find((d) => d.id === "DK-A01")!;
  assert.equal(commandGuard(d, [], 30, "on"), "");
  for (const duration of [0, 301, 1.5, NaN])
    assert.ok(commandGuard(d, [], duration, "on"));
  assert.ok(commandGuard({ ...d, connection: "offline" }, [], 30, "on"));
  assert.ok(commandGuard({ ...d, controllerId: "ESP32-C" }, [], 30, "on"));
  assert.ok(commandGuard({ ...d, automatic: true }, [], 30, "on"));
  assert.ok(
    commandGuard(
      d,
      [
        {
          id: "L",
          deviceId: d.id,
          requested: "on",
          source: "Nguyễn Minh",
          at: "",
          result: "waiting",
          message: "",
        },
      ],
      30,
      "on",
    ),
  );
  assert.ok(commandGuard({ ...d, reported: "on" }, [], 30, "on"));
  assert.equal(commandGuard({ ...d, reported: "unknown" }, [], 30, "on"), "");
});
test("Liên kết môi trường chọn đúng cảm biến bổ sung và giữ tổng kho thiết bị chung", () => {
  const view = deviceEnvironmentView(initialDevices);
  assert.equal(view.measurements.length, 7);
  assert.deepEqual(view.counts, { current: 4, stale: 1, offline: 2 });
  assert.equal(
    view.areas.reduce((n, a) => n + a.total, 0),
    29,
  );
  const selected = deviceEnvironmentView(initialDevices, "", "TB-A05");
  assert.equal(selected.measurements.length, 1);
  assert.equal(selected.measurements[0].value, 65);
  assert.equal(selected.areas.length, 1);
  assert.equal(
    selected.areas[0].total,
    initialDevices.filter((d) => d.group === "sensor" && d.area === "A").length,
  );
});
