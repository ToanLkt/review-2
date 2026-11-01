import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient } from "@/lib/api/client";
import { createStaffCultivationService, type SupplyRequest } from "@/lib/api/staff/staff-cultivation-service";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "staff-token", getRefreshToken: () => null, getExpiresAt: () => null,
  getPersistence: () => "session", setTokens: () => undefined, clear: () => undefined,
};
function jsonResponse(data: unknown, status = 200) { return new Response(JSON.stringify({ success: true, message: "OK", data, errors: null }), { status, headers: { "Content-Type": "application/json" } }); }

test("staff cultivation service maps all twenty-two Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const supply = { supplyId: 1, supplyName: "Rau muống", supplyType: "SEED", description: null, harvestDays: 10, imageUrl: null, costPrice: 1, unitPrice: 2, rentalPrice: 3, quantityInStock: 100, unit: "GÓI", minStockLevel: 10, isActive: true };
  const threshold = { thresholdId: 2, supplyId: 1, stage: "GROWING", minSoilMoisture: 40, maxSoilMoisture: 70, minAirHumidity: 50, maxAirHumidity: 80, minTemperature: 20, maxTemperature: 30, minLightIntensity: 100, maxLightIntensity: 500, lightHoursPerDay: 12 };
  const schedule = { scheduleId: 3, supplyId: 1, dayIndex: 1, taskName: "Tưới", taskDescription: null, targetStage: "GERMINATION" };
  const cycle = { rentalId: 4, customerId: 10, soilTrayId: 5, supplyId: 1, orderId: 20, startDate: "2026-09-22T01:00:00Z", expectedHarvestDate: "2026-10-02T01:00:00Z", actualHarvestDate: null, cropStatus: "PLANTED" };
  const task = { taskId: 6, rentalId: 4, assignedUserId: null, taskName: "Tưới", dueDate: "2026-09-23T00:00:00Z", status: "PENDING", completedAt: null, notes: null };
  const client = createApiClient({ baseUrl: "http://localhost:5080", tokenStore, fetcher: async (input, init) => {
    const url = new URL(String(input)); calls.push({ method: init?.method ?? "GET", path: url.pathname, query: url.search, body: init?.body ? JSON.parse(String(init.body)) as unknown : null, auth: new Headers(init?.headers).get("Authorization") ?? "" });
    if (init?.method === "DELETE") return jsonResponse({});
    if (url.pathname.endsWith("/tasks/generate")) return jsonResponse({ created: 2 });
    if (url.pathname.includes("/thresholds")) return jsonResponse(init?.method === "GET" ? [threshold] : threshold);
    if (url.pathname.includes("/care-schedules")) return jsonResponse(init?.method === "GET" ? [schedule] : schedule);
    if (url.pathname.includes("/cycles")) return jsonResponse(init?.method === "GET" ? [cycle] : cycle);
    if (url.pathname.includes("/tasks")) return jsonResponse(init?.method === "GET" ? [task] : task);
    if (url.pathname.endsWith("/supplies")) return jsonResponse(init?.method === "GET" ? [supply] : supply, init?.method === "POST" ? 201 : 200);
    return jsonResponse(supply);
  } });
  const service = createStaffCultivationService(client);
  const supplyRequest: SupplyRequest = { ...supply }; delete (supplyRequest as Partial<typeof supply>).supplyId;

  await service.supplies({ type: "SEED", active: true }); await service.supply(1); await service.createSupply(supplyRequest); await service.updateSupply(1, supplyRequest); await service.deactivateSupply(1);
  await service.thresholds(1); await service.createThreshold({ ...threshold }); await service.updateThreshold(2, { ...threshold }); await service.deleteThreshold(2);
  await service.schedules(1); await service.createSchedule({ ...schedule }); await service.updateSchedule(3, { ...schedule }); await service.deleteSchedule(3);
  await service.cycles("PLANTED"); await service.startCycle({ customerId: 10, soilTrayId: 5, supplyId: 1, orderId: 20, startDate: null }); await service.updateCycleStatus(4, "GROWING"); await service.harvest(4, "2026-10-02T01:00:00Z"); await service.nextCycle(4); await service.generateTasks(4);
  await service.tasks({ rentalId: 4, status: "PENDING" }); await service.assignTask(6, 2); await service.completeTask(6, { status: "COMPLETED", notes: "Đã tưới" });

  assert.equal(calls.length, 22);
  assert.deepEqual(calls.map((call) => `${call.method} ${call.path}`), [
    "GET /api/v1/staff/cultivation/supplies", "GET /api/v1/staff/cultivation/supplies/1", "POST /api/v1/staff/cultivation/supplies", "PUT /api/v1/staff/cultivation/supplies/1", "DELETE /api/v1/staff/cultivation/supplies/1",
    "GET /api/v1/staff/cultivation/thresholds", "POST /api/v1/staff/cultivation/thresholds", "PUT /api/v1/staff/cultivation/thresholds/2", "DELETE /api/v1/staff/cultivation/thresholds/2",
    "GET /api/v1/staff/cultivation/care-schedules", "POST /api/v1/staff/cultivation/care-schedules", "PUT /api/v1/staff/cultivation/care-schedules/3", "DELETE /api/v1/staff/cultivation/care-schedules/3",
    "GET /api/v1/staff/cultivation/cycles", "POST /api/v1/staff/cultivation/cycles", "PUT /api/v1/staff/cultivation/cycles/4/status", "PUT /api/v1/staff/cultivation/cycles/4/harvest", "POST /api/v1/staff/cultivation/cycles/4/next-cycle", "POST /api/v1/staff/cultivation/cycles/4/tasks/generate",
    "GET /api/v1/staff/cultivation/tasks", "PUT /api/v1/staff/cultivation/tasks/6/assignee", "PUT /api/v1/staff/cultivation/tasks/6/complete",
  ]);
  assert.match(calls[0].query, /type=SEED/); assert.deepEqual(calls[15].body, { status: "GROWING" }); assert.deepEqual(calls[20].body, { assignedUserId: 2 }); assert.ok(calls.every((call) => call.auth === "Bearer staff-token"));
});
