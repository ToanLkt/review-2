import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../lib/api/client";
import { createRackAndConfirm, createTrayAndConfirm, normalizeZoneName, rackMatchesRequest, suggestRackCode, trayCodeForPosition, updateRackAndConfirm, updateZoneAndConfirm, zoneNameSuffix } from "../lib/operations/farm-workflow";
import type { FarmRack, FarmZoneSummary, SoilTray } from "../lib/api/staff/staff-farm-service";

test("mã kệ gợi ý theo tên khu vực và tránh trùng trong form", () => {
  assert.equal(suggestRackCode("Khu A", 0), "KHU-A-R01");
  assert.equal(suggestRackCode("Khu A", 1, ["KHU-A-R02"]), "KHU-A-R03");
});

test("tên khu vực luôn theo mẫu Khu ...", () => {
  assert.equal(normalizeZoneName("Khu A"), "Khu A");
  assert.equal(normalizeZoneName("khu--Nhà kính 1"), "Khu Nhà kính 1");
  assert.equal(normalizeZoneName("Nhà kính 1"), "Khu Nhà kính 1");
  assert.equal(normalizeZoneName("Khu-"), "");
  assert.equal(zoneNameSuffix("Khu Nhà kính 1"), "Nhà kính 1");
});

test("mã khay sinh từ khu vực, kệ, tầng và vị trí", () => {
  assert.equal(trayCodeForPosition("4/9/1/6", "Khu AV", "KHU-AV-R01"), "KHU-AV-R01-T1-P6");
  assert.equal(trayCodeForPosition("36/37/10/20", "Khu Nhà", "Kệ 01"), "KHU-NHA-KE-01-TA-PK");
  assert.equal(trayCodeForPosition("4/7/2", "Khu A", "KHU-A-R01"), "");
  assert.equal(trayCodeForPosition("4/7/2/3", "", "KHU-A-R01"), "");
  assert.ok(trayCodeForPosition("4/7/2/3", "Khu Nhà kính phía đông rất dài", "KHU-NHA-KINH-PHIA-DONG-R01").length <= 24);
});

test("POST kệ trả 500 sau khi lưu: xác nhận đúng zone và cấu hình bằng GET", async () => {
  const body = { zoneId: 4, rackCode: "KHU-A-R01", totalTiers: 2, maxTraysPerTier: 4 };
  const rack: FarmRack = { rackId: 7, ...body };
  const result = await createRackAndConfirm(body,
    async () => { throw new ApiError("Internal server error", 500, null, null); },
    async (zoneId) => { assert.equal(zoneId, 4); return [rack]; });
  assert.deepEqual(result, rack);
});

test("POST kệ trùng mã thật trả 409, không nhận nhầm kệ của khu vực khác", async () => {
  const body = { zoneId: 4, rackCode: "KHU-A-R01", totalTiers: 2, maxTraysPerTier: 4 };
  const error = new ApiError("Rack code already exists.", 409, null, null);
  let listed = false;
  await assert.rejects(createRackAndConfirm(body, async () => { throw error; }, async () => { listed = true; return []; }), error);
  assert.equal(listed, false);
});

test("PUT kệ trả 500 sau khi đã lưu: đối soát đúng ID và cấu hình", async () => {
  const body = { zoneId: 12, rackCode: "KHU-AZ-R01", totalTiers: 2, maxTraysPerTier: 4 };
  const rack: FarmRack = { rackId: 12, ...body };
  assert.equal(rackMatchesRequest(rack, body), true);
  const result = await updateRackAndConfirm(12, body,
    async () => { throw new ApiError("Internal server error", 500, null, null); },
    async (zoneId) => { assert.equal(zoneId, 12); return [rack]; });
  assert.deepEqual(result, rack);
  await assert.rejects(updateRackAndConfirm(12, body,
    async () => { throw new ApiError("Internal server error", 500, null, null); },
    async () => [{ ...rack, totalTiers: 3 }]), /Internal server error/);
});

test("PUT khu vực trả 500 sau khi lưu: GET xác nhận đủ tên, vị trí và sức chứa", async () => {
  const body = { zoneName: "Khu AZ", locationDescription: "Tầng 2", totalCapacity: 8, isActive: true };
  const zone: FarmZoneSummary = { zoneId: 12, ...body, rackCount: 1, trayCount: 0, availableTrays: 0 };
  const result = await updateZoneAndConfirm(12, body,
    async () => { throw new ApiError("Internal server error", 500, null, null); },
    async () => [zone]);
  assert.deepEqual(result, zone);
});

test("POST khay trả 500 sau khi lưu: xác nhận đúng rack, tầng và trạng thái", async () => {
  const body = { rackId: 1, tierIndex: 2, trayCode: "FFF", currentStatus: "AVAILABLE" as const };
  const tray: SoilTray = { soilTrayId: 9, ...body };
  const result = await createTrayAndConfirm(body,
    async () => { throw new ApiError("Internal server error", 500, null, null); },
    async (rackId) => { assert.equal(rackId, 1); return [tray]; });
  assert.deepEqual(result, tray);
});
