export type TrayDraft = {
  clientId: string;
  seedVarietyId: number | null;
  farmAreaId: number | null;
  totalCycles: number;
  targetPlantingDate: string;
  targetDeliveryDate: string;
  dateSource: "planting" | "delivery" | null;
};

export function createTrayDraft(clientId: string, seedVarietyId: number | null = null): TrayDraft {
  return {
    clientId,
    seedVarietyId,
    farmAreaId: null,
    totalCycles: 1,
    targetPlantingDate: "",
    targetDeliveryDate: "",
    dateSource: null,
  };
}

function shiftDay(value: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isInteger(days)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function deliveryDateFromPlanting(plantingDate: string, growthDays: number) {
  return growthDays >= 0 ? shiftDay(plantingDate, growthDays) : "";
}

export function plantingDateFromDelivery(deliveryDate: string, growthDays: number) {
  return growthDays >= 0 ? shiftDay(deliveryDate, -growthDays) : "";
}

export function synchronizeDraftDates(draft: TrayDraft, growthDays: number): TrayDraft {
  if (draft.dateSource === "delivery" && draft.targetDeliveryDate) {
    return { ...draft, targetPlantingDate: plantingDateFromDelivery(draft.targetDeliveryDate, growthDays) };
  }
  if (draft.targetPlantingDate) {
    return { ...draft, targetDeliveryDate: deliveryDateFromPlanting(draft.targetPlantingDate, growthDays) };
  }
  return { ...draft, targetDeliveryDate: "" };
}

export function toBackendDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : null;
}

export function resizeTrayDrafts(
  drafts: TrayDraft[],
  quantity: number,
  createId: () => string,
): TrayDraft[] {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  if (safeQuantity <= drafts.length) return drafts.slice(0, safeQuantity);

  return [
    ...drafts,
    ...Array.from(
      { length: safeQuantity - drafts.length },
      () => createTrayDraft(createId()),
    ),
  ];
}

export function hasUnselectedTray(drafts: TrayDraft[]) {
  return drafts.some((draft) => draft.seedVarietyId === null);
}

export function requestedTrayCount(cartItemCount: number, draftCount: number) {
  return Math.max(0, cartItemCount) + Math.max(0, draftCount);
}

export function remainingDraftCapacity(available: number | null, cartItemCount: number) {
  if (available === null) return null;
  return Math.max(0, Math.floor(available) - Math.max(0, Math.floor(cartItemCount)));
}

export function exceedsAvailableCapacity(
  available: number | null,
  cartItemCount: number,
  draftCount: number,
) {
  return available !== null && requestedTrayCount(cartItemCount, draftCount) > available;
}

export function isOptionalDateInRange(value: string, minDate: string, maxDate?: string | null) {
  if (!value) return true;
  return value >= minDate && (!maxDate || value <= maxDate);
}

export function areDraftSchedulesValid(drafts: TrayDraft[], minDate: string, maxDate?: string | null) {
  return drafts.every((draft) => Number.isInteger(draft.totalCycles)
    && draft.totalCycles >= 1
    && draft.totalCycles <= 100
    && isOptionalDateInRange(draft.targetPlantingDate, minDate, maxDate));
}

export type RentalWizardValidation = {
  capacityReady: boolean;
  hasCapacity: boolean;
  overCapacity: boolean;
  hasMissingSeed: boolean;
  scheduleReady: boolean;
  schedulesValid: boolean;
  riskAccepted: boolean;
};

export function canAdvanceRentalStep(step: number, validation: RentalWizardValidation) {
  if (step === 1) return validation.capacityReady && validation.hasCapacity && !validation.overCapacity;
  if (step === 2) return !validation.hasMissingSeed;
  if (step === 3) return validation.scheduleReady && validation.schedulesValid;
  if (step === 4) return validation.riskAccepted;
  return false;
}

export function canStartRentalAction(step: number, finalConfigurationValid: boolean, requestInFlight: boolean) {
  return step === 5 && finalConfigurationValid && !requestInFlight;
}
