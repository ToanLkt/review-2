import { useCallback, useEffect, useState } from "react";
import type { DeliveryPreview } from "./api";

export type DeliveryAddressValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

const storageKey = "smartfarm_delivery_address_draft";
const emptyValue: DeliveryAddressValue = { address: "", latitude: null, longitude: null };

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function restoreDraft(): DeliveryAddressValue | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<DeliveryAddressValue>;
    if (typeof value.address !== "string"
      || !isCoordinate(value.latitude, -90, 90)
      || !isCoordinate(value.longitude, -180, 180)) return null;
    return { address: value.address, latitude: value.latitude, longitude: value.longitude };
  } catch {
    return null;
  }
}

export function clearDeliveryAddressDraft() {
  try { sessionStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
}

export function useDeliveryAddressDraft() {
  const [value, setValueState] = useState<DeliveryAddressValue>(emptyValue);
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = restoreDraft();
      if (stored) setValueState(stored);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Keep the form usable in memory. */ }
  }, [hydrated, value]);

  const setValue = useCallback((next: DeliveryAddressValue) => {
    setValueState(next);
    setPreview(null);
    setIsAccepted(false);
  }, []);

  return { value, setValue, preview, setPreview, isAccepted, setIsAccepted };
}
