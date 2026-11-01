import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffIoTService, type DeviceRequest } from "@/lib/api/staff/staff-iot-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token", getRefreshToken: () => null, getExpiresAt: () => null,
  getPersistence: () => "session", setTokens: () => undefined, clear: () => undefined,
};
function response(data: unknown, status = 200) { return new Response(status === 204 ? null : JSON.stringify({ success: true, message: "OK", data, errors: null }), { status, headers: { "Content-Type": "application/json" } }); }

test("staff IoT service maps all seventeen Backend endpoints", async () => {
  const calls: { method: string; url: URL; body: unknown; auth: string }[] = [];
  const device = { deviceId: 1, deviceCode: "ESP-01", macAddress: "AA:BB", deviceType: "ESP32", firmwareVersion: "1.0", status: "ONLINE", lastSeen: "2026-10-03T01:00:00Z" };
  const assignment = { trayDeviceId: 2, soilTrayId: 3, trayCode: "A-03", deviceId: 1, deviceCode: "ESP-01", pinNumber: "D4", componentType: "WATER_PUMP", assignedAt: "2026-10-03T01:00:00Z", isActive: true };
  const snapshot = { snapshotId: 4, deviceId: 1, rentalId: 5, imageUrl: "https://example.com/a.jpg", takenAt: "2026-10-03T01:00:00Z" };
  const log = { logId: 6, deviceId: 1, pinNumber: "D4", actuatorType: "PUMP", action: "ON", triggeredBy: "STAFF", commandId: "cmd-1", requestedByUserId: 9, requestedAt: "2026-10-03T01:00:00Z", acknowledgedAt: null, result: "PENDING", failureReason: null };
  const alert = { alertId: 7, deviceId: 1, supplyId: null, rentalId: 5, alertType: "OFFLINE", severity: "HIGH", message: "Mất kết nối", isResolved: false, createdAt: "2026-10-03T01:00:00Z" };
  const client = createApiClient({ baseUrl: "http://localhost:5080", tokenStore, fetcher: async (input, init) => {
    const url = new URL(String(input)); calls.push({ method: init?.method ?? "GET", url, body: init?.body ? JSON.parse(String(init.body)) as unknown : null, auth: new Headers(init?.headers).get("Authorization") ?? "" });
    if (init?.method === "DELETE" && url.pathname.endsWith("/devices/1")) return response(null, 204);
    if (url.pathname.includes("tray-devices")) return response(init?.method === "GET" ? [assignment] : assignment);
    if (url.pathname.includes("camera-snapshots")) return response(init?.method === "GET" ? { items: [snapshot], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } : snapshot);
    if (url.pathname.includes("actuator-logs")) return response({ items: [log], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
    if (url.pathname.includes("actuator-commands")) return response(log, init?.method === "POST" ? 202 : 200);
    if (url.pathname.includes("alerts")) return response(init?.method === "GET" ? { items: [alert], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } : { ...alert, isResolved: true });
    if (url.pathname.endsWith("/devices") && init?.method === "GET") return response({ items: [device], page: 2, pageSize: 20, totalItems: 21, totalPages: 2 });
    if (url.pathname.endsWith("/devices/1/latest")) return response({ deviceId: 1, fanState: true, ledState: null, pumpState: false, isStale: false });
    return response(device, init?.method === "POST" ? 201 : 200);
  } });
  const service = createStaffIoTService(client);
  const body: DeviceRequest = { deviceCode: "ESP-01", macAddress: "AA:BB", deviceType: "ESP32", firmwareVersion: "1.0", status: "ONLINE" };
  const from = new Date("2026-10-01T00:00:00Z"); const to = new Date("2026-10-03T23:59:59Z");

  await service.devices({ status: "ONLINE", search: "ESP", page: 2, pageSize: 20 }); await service.device(1); await service.createDevice(body); await service.updateDevice(1, body); await service.updateStatus(1, "OFFLINE"); await service.deactivateDevice(1);
  await service.trayDevices({ soilTrayId: 3, active: true }); await service.assign({ soilTrayId: 3, deviceId: 1, pinNumber: "D4", componentType: "WATER_PUMP" }); await service.unassign(2);
  await service.addSnapshot({ deviceId: 1, rentalId: 5, imageUrl: "https://example.com/a.jpg", takenAt: null }); await service.snapshots({ rentalId: 5, deviceId: 1, page: 1, pageSize: 20 });
  await service.logs({ deviceId: 1, result: "SUCCESS", from, to, page: 1, pageSize: 20 }); await service.command(1, { actuatorType: "WATER_PUMP", action: "ON" }); await service.commandStatus("cmd/1");
  await service.alerts({ resolved: false, severity: "HIGH", deviceId: 1, page: 1, pageSize: 20 }); await service.resolveAlert(7, true);
  const latest = await service.latestTelemetry(1);
  assert.equal(latest.fanState, true);

  assert.equal(calls.length, 17);
  assert.deepEqual(calls.map((call) => `${call.method} ${call.url.pathname}`), [
    "GET /api/v1/staff/iot/devices", "GET /api/v1/staff/iot/devices/1", "POST /api/v1/staff/iot/devices", "PUT /api/v1/staff/iot/devices/1", "PUT /api/v1/staff/iot/devices/1/status", "DELETE /api/v1/staff/iot/devices/1",
    "GET /api/v1/staff/iot/tray-devices", "POST /api/v1/staff/iot/tray-devices", "DELETE /api/v1/staff/iot/tray-devices/2",
    "POST /api/v1/staff/iot/camera-snapshots", "GET /api/v1/staff/iot/camera-snapshots",
    "GET /api/v1/staff/iot/actuator-logs", "POST /api/v1/staff/iot/devices/1/actuator-commands", "GET /api/v1/staff/iot/actuator-commands/cmd%2F1",
    "GET /api/v1/staff/iot/alerts", "PATCH /api/v1/staff/iot/alerts/7/resolve", "GET /api/v1/staff/iot/devices/1/latest",
  ]);
  assert.equal(calls[0].url.searchParams.get("status"), "ONLINE"); assert.equal(calls[11].url.searchParams.get("from"), from.toISOString()); assert.equal(calls[11].url.searchParams.get("to"), to.toISOString());
  assert.deepEqual(calls[4].body, { status: "OFFLINE", lastSeen: null }); assert.deepEqual(calls[12].body, { actuatorType: "WATER_PUMP", action: "ON" }); assert.deepEqual(calls[15].body, { isResolved: true });
  assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
