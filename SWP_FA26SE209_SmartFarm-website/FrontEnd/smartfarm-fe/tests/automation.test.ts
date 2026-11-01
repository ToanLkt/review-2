import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialRules,
  automationHistory,
  validateRule,
  saveRule,
  settleRule,
  retryRule,
  applyRuleOwnership,
  thresholdText,
  actionText,
} from "../lib/automation";
import { initialDevices, commandGuard } from "../lib/devices";
const now = "2026-09-10T15:00:00+07:00";
test("Bản nháp không ghi đè quyền tự động đã có của thiết bị khác", () => {
  const draft = saveRule(
    undefined,
    "QT-004",
    {
      ...initialRules[0].requested,
      outputId: "DK-B09",
      enabled: false,
      duration: null,
    },
    "draft",
    now,
  );
  const owned = applyRuleOwnership(initialDevices, [draft]);
  assert.equal(owned.find((d) => d.id === "DK-B09")?.automatic, true);
});
test("Ba quy tắc tham chiếu, cấu hình chờ khác bản xác nhận và bốn lịch sử theo phiên bản cũ", () => {
  assert.deepEqual(
    initialRules.map((r) => r.status),
    ["acknowledged", "sending", "draft"],
  );
  assert.deepEqual(
    initialRules.map((r) => r.requested.enabled),
    [true, true, false],
  );
  initialRules.forEach((r) =>
    assert.deepEqual(validateRule(r.requested, initialDevices), {}),
  );
  assert.equal(initialRules[1].version, 2);
  assert.equal(initialRules[1].acknowledged?.version, 1);
  assert.equal(initialRules[1].requested.threshold, 8000);
  assert.equal(initialRules[1].acknowledged?.config.threshold, 7500);
  assert.equal(automationHistory.length, 4);
  assert.ok(automationHistory.every((e) => e.version === 1));
  assert.deepEqual(
    automationHistory.map((e) => e.result),
    ["success", "success", "success", "failed"],
  );
  assert.equal(
    thresholdText(initialRules[0].requested, initialDevices),
    "Độ ẩm đất < 40%",
  );
  assert.equal(
    thresholdText(initialRules[1].requested, initialDevices),
    "Ánh sáng < 8.000 lux",
  );
  assert.equal(
    actionText(initialRules[0].requested, initialDevices),
    "Bật bơm 30 giây",
  );
});
test("Kiểm tra tên, ngưỡng, đơn vị, giới hạn bơm và không gán chéo ESP32", () => {
  const c = initialRules[0].requested;
  assert.ok(validateRule({ ...c, name: " " }, initialDevices).name);
  for (const threshold of [NaN, Infinity, -1, 101])
    assert.ok(validateRule({ ...c, threshold }, initialDevices).threshold);
  for (const duration of [null, 0, -1, 301, 1.5])
    assert.ok(validateRule({ ...c, duration }, initialDevices).duration);
  assert.deepEqual(
    validateRule({ ...c, threshold: 0, duration: 1 }, initialDevices),
    {},
  );
  assert.deepEqual(
    validateRule({ ...c, threshold: 100, duration: 300 }, initialDevices),
    {},
  );
  assert.ok(
    validateRule({ ...c, sensorId: "TB-A01" }, initialDevices).sensorId,
  );
  assert.ok(
    validateRule({ ...c, outputId: "DK-A01" }, initialDevices).outputId,
  );
  assert.ok(
    validateRule({ ...c, controllerId: "ESP32-C" }, initialDevices)
      .controllerId,
  );
  assert.ok(validateRule({ ...c, location: "Kệ 9" }, initialDevices).location);
  assert.ok(
    validateRule({ ...c, sensorId: "KH-A01" }, initialDevices).sensorId,
  );
  assert.ok(
    validateRule({ ...c, outputId: "DK-B10" }, initialDevices, initialRules[0])
      .outputId,
  );
  const binary = initialDevices.map((d) =>
    d.id === c.sensorId
      ? {
          ...d,
          reading: { ...d.reading!, value: null, levelState: "Mực nước thấp" },
        }
      : d,
  );
  assert.ok(validateRule(c, binary).sensorId);
});
test("Lưu bản nháp không gửi, không thay đổi bản xác nhận hay trạng thái vật lý", () => {
  const previous = initialRules[0];
  const draft = saveRule(
    previous,
    previous.id,
    { ...previous.requested, enabled: false, threshold: 45 },
    "draft",
    now,
  );
  assert.equal(draft.status, "draft");
  assert.equal(draft.inFlight, false);
  assert.equal(draft.version, 2);
  assert.deepEqual(draft.acknowledged, previous.acknowledged);
  assert.equal(draft.lastAttemptAt, previous.lastAttemptAt);
  assert.equal(draft.attempts, previous.attempts);
  const devices = applyRuleOwnership(initialDevices, [draft]);
  assert.ok(devices.find((d) => d.id === "DK-B07")?.automatic);
  assert.deepEqual(
    devices.map((d) => d.reported),
    initialDevices.map((d) => d.reported),
  );
});
test("Chỉ xác nhận đúng phiên bản đang chờ mới cập nhật hiệu lực; bỏ xác nhận cũ", () => {
  const previous = initialRules[0];
  const pending = saveRule(
    previous,
    previous.id,
    { ...previous.requested, enabled: false },
    "send",
    now,
  );
  assert.equal(pending.status, "sending");
  assert.ok(pending.inFlight);
  assert.ok(pending.acknowledged?.config.enabled);
  assert.throws(() =>
    saveRule(pending, pending.id, pending.requested, "send", now),
  );
  assert.equal(settleRule(pending, 1, "acknowledged", now), pending);
  assert.equal(settleRule(pending, 2, "acknowledged", now), pending);
  const waiting = settleRule(pending, 2, "waiting", now);
  assert.equal(waiting.status, "waiting");
  const acknowledged = settleRule(waiting, 2, "acknowledged", now);
  assert.equal(acknowledged.status, "acknowledged");
  assert.equal(acknowledged.acknowledged?.config.enabled, false);
  assert.equal(acknowledged.acknowledged?.version, 2);
  assert.equal(acknowledged.lastAcknowledgedAt, now);
  assert.equal(acknowledged.inFlight, false);
  const newer = saveRule(
    acknowledged,
    acknowledged.id,
    { ...acknowledged.requested, enabled: true },
    "send",
    now,
  );
  assert.equal(settleRule(newer, 2, "acknowledged", now), newer);
  const before = applyRuleOwnership(initialDevices, [waiting]),
    after = applyRuleOwnership(initialDevices, [acknowledged]);
  assert.ok(
    commandGuard(
      before.find((d) => d.id === "DK-B07")!,
      [],
      30,
      "on",
    ),
  );
  assert.equal(
    commandGuard(
      after.find((d) => d.id === "DK-B07")!,
      [],
      30,
      "on",
    ),
    "",
  );
  assert.deepEqual(
    before.map((d) => d.reported),
    after.map((d) => d.reported),
  );
});
test("Thất bại giữ bản xác nhận, gửi lại giữ phiên bản và chặn gửi trùng", () => {
  const prev = initialRules[0],
    sending = saveRule(
      prev,
      prev.id,
      { ...prev.requested, enabled: false },
      "send",
      now,
    );
  const failed = settleRule(
    sending,
    sending.version,
    "failed",
    now,
    "Thất bại mô phỏng",
  );
  assert.deepEqual(failed.acknowledged, prev.acknowledged);
  assert.equal(failed.status, "failed");
  const retry = retryRule(failed, now);
  assert.equal(retry.version, sending.version);
  assert.equal(retry.attempts, 2);
  assert.ok(retry.inFlight);
  assert.throws(() => retryRule(retry, now));
  assert.throws(() => retryRule(prev, now));
  const ack = settleRule(
    settleRule(retry, retry.version, "waiting", now),
    retry.version,
    "acknowledged",
    now,
  );
  assert.equal(ack.acknowledged?.config.enabled, false);
});
test("ESP32-C mất mạng vẫn giữ bản cục bộ, không tạo xác nhận hay nhật ký mới", () => {
  const history = JSON.stringify(automationHistory),
    prev = initialRules[1];
  const queued = saveRule(
    prev,
    prev.id,
    { ...prev.requested, enabled: false },
    "send",
    now,
  );
  assert.equal(queued.status, "offline");
  assert.equal(queued.inFlight, false);
  assert.deepEqual(queued.acknowledged, prev.acknowledged);
  assert.equal(settleRule(queued, queued.version, "acknowledged", now), queued);
  assert.equal(retryRule(queued, now).status, "offline");
  assert.ok(
    applyRuleOwnership(initialDevices, [queued]).find((d) => d.id === "DK-C01")
      ?.automatic,
  );
  assert.equal(JSON.stringify(automationHistory), history);
});
