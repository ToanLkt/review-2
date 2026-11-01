import assert from "node:assert/strict";
import test from "node:test";

import {
  areDraftSchedulesValid,
  canAdvanceRentalStep,
  canStartRentalAction,
  createTrayDraft,
  deliveryDateFromPlanting,
  exceedsAvailableCapacity,
  hasUnselectedTray,
  isOptionalDateInRange,
  plantingDateFromDelivery,
  remainingDraftCapacity,
  requestedTrayCount,
  resizeTrayDrafts,
  synchronizeDraftDates,
  toBackendDateOnly,
} from "@/lib/rental-drafts";

test("one tray starts without an automatically selected seed", () => {
  const draft = createTrayDraft("tray-1");
  assert.equal(draft.seedVarietyId, null);
  assert.equal(hasUnselectedTray([draft]), true);
});

test("increasing tray quantity preserves selections and creates empty tray drafts", () => {
  const initial = [createTrayDraft("tray-1", 10)];
  let nextId = 1;
  const drafts = resizeTrayDrafts(initial, 3, () => `tray-${++nextId}`);

  assert.equal(drafts.length, 3);
  assert.equal(drafts[0].seedVarietyId, 10);
  assert.equal(drafts[1].seedVarietyId, null);
  assert.equal(drafts[2].seedVarietyId, null);
});

test("decreasing tray quantity removes trailing drafts and keeps remaining selections", () => {
  const drafts = [
    createTrayDraft("tray-1", 10),
    createTrayDraft("tray-2", 20),
    createTrayDraft("tray-3", 30),
  ];
  const resized = resizeTrayDrafts(drafts, 2, () => "unused");

  assert.deepEqual(resized.map((draft) => draft.seedVarietyId), [10, 20]);
});

test("multiple trays may select the same Backend seed without merging", () => {
  const drafts = [
    createTrayDraft("tray-1", 10),
    createTrayDraft("tray-2", 10),
    createTrayDraft("tray-3", 10),
  ];

  assert.equal(hasUnselectedTray(drafts), false);
  assert.equal(drafts.length, 3);
  assert.equal(new Set(drafts.map((draft) => draft.clientId)).size, 3);
});

test("capacity warning compares existing cart items plus current drafts", () => {
  assert.equal(requestedTrayCount(2, 3), 5);
  assert.equal(exceedsAvailableCapacity(4, 2, 3), true);
  assert.equal(exceedsAvailableCapacity(5, 2, 3), false);
  assert.equal(exceedsAvailableCapacity(0, 0, 1), true);
});

test("draft capacity subtracts trays already waiting in the rental cart", () => {
  assert.equal(remainingDraftCapacity(5, 0), 5);
  assert.equal(remainingDraftCapacity(5, 2), 3);
  assert.equal(remainingDraftCapacity(1, 3), 0);
  assert.equal(remainingDraftCapacity(null, 3), null);
});

test("wizard blocks each incomplete step", () => {
  const complete = {
    capacityReady: true,
    hasCapacity: true,
    overCapacity: false,
    hasMissingSeed: false,
    scheduleReady: true,
    schedulesValid: true,
    riskAccepted: true,
  };

  assert.equal(canAdvanceRentalStep(1, { ...complete, overCapacity: true }), false);
  assert.equal(canAdvanceRentalStep(2, { ...complete, hasMissingSeed: true }), false);
  assert.equal(canAdvanceRentalStep(3, { ...complete, schedulesValid: false }), false);
  assert.equal(canAdvanceRentalStep(4, { ...complete, riskAccepted: false }), false);
  assert.equal(canAdvanceRentalStep(4, complete), true);
});

test("wizard accepts optional planting dates only inside the Backend range", () => {
  assert.equal(isOptionalDateInRange("", "2026-10-14", "2026-10-21"), true);
  assert.equal(isOptionalDateInRange("2026-10-14", "2026-10-14", "2026-10-21"), true);
  assert.equal(isOptionalDateInRange("2026-10-21", "2026-10-14", "2026-10-21"), true);
  assert.equal(isOptionalDateInRange("2026-10-13", "2026-10-14", "2026-10-21"), false);
  assert.equal(isOptionalDateInRange("2026-10-22", "2026-10-14", "2026-10-21"), false);
});

test("wizard schedule validation keeps all tray dates and cycles valid", () => {
  const first = { ...createTrayDraft("tray-1", 1), targetPlantingDate: "2026-10-18", totalCycles: 2 };
  const second = { ...createTrayDraft("tray-2", 2), targetPlantingDate: "", totalCycles: 1 };
  assert.equal(areDraftSchedulesValid([first, second], "2026-10-14", "2026-10-21"), true);
  assert.equal(areDraftSchedulesValid([{ ...first, targetPlantingDate: "2026-10-22" }], "2026-10-14", "2026-10-21"), false);
  assert.equal(areDraftSchedulesValid([{ ...first, totalCycles: 0 }], "2026-10-14", "2026-10-21"), false);
});

test("wizard cannot create a cart or order before step five or during an active request", () => {
  assert.equal(canStartRentalAction(4, true, false), false);
  assert.equal(canStartRentalAction(5, false, false), false);
  assert.equal(canStartRentalAction(5, true, true), false);
  assert.equal(canStartRentalAction(5, true, false), true);
});

test("planting and delivery dates are calculated in both directions without timezone drift", () => {
  assert.equal(deliveryDateFromPlanting("2026-10-20", 7), "2026-10-27");
  assert.equal(plantingDateFromDelivery("2026-10-27", 7), "2026-10-20");
  assert.equal(deliveryDateFromPlanting("2026-12-29", 7), "2027-01-05");
  assert.equal(toBackendDateOnly("2026-10-20"), "2026-10-20T00:00:00.000Z");
});

test("the last edited date remains the source when a seed growth duration changes", () => {
  const plantingSource = {
    ...createTrayDraft("tray-1", 1),
    targetPlantingDate: "2026-10-20",
    targetDeliveryDate: "2026-10-27",
    dateSource: "planting" as const,
  };
  const deliverySource = { ...plantingSource, dateSource: "delivery" as const };

  assert.equal(synchronizeDraftDates(plantingSource, 10).targetDeliveryDate, "2026-10-30");
  assert.equal(synchronizeDraftDates(deliverySource, 10).targetPlantingDate, "2026-10-17");
});

test("multiple trays calculate delivery dates independently for each seed", () => {
  const first = synchronizeDraftDates({
    ...createTrayDraft("tray-1", 1),
    targetPlantingDate: "2026-10-20",
    dateSource: "planting",
  }, 7);
  const second = synchronizeDraftDates({
    ...createTrayDraft("tray-2", 2),
    targetPlantingDate: "2026-10-20",
    dateSource: "planting",
  }, 12);

  assert.equal(first.targetDeliveryDate, "2026-10-27");
  assert.equal(second.targetDeliveryDate, "2026-11-01");
});
