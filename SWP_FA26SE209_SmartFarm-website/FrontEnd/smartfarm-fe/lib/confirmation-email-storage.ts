const storageKey = "smartfarm_pending_confirmation_email";
const lifetimeMs = 24 * 60 * 60 * 1_000;

type StoredConfirmationEmail = {
  email: string;
  expiresAt: number;
};

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getConfirmationEmailSnapshot() {
  try {
    return storage()?.getItem(storageKey) ?? null;
  } catch {
    return null;
  }
}

export function readConfirmationEmail(snapshot = getConfirmationEmailSnapshot()) {
  if (!snapshot) return "";
  try {
    const value = JSON.parse(snapshot) as Partial<StoredConfirmationEmail>;
    if (
      typeof value.email !== "string"
      || !value.email.trim()
      || typeof value.expiresAt !== "number"
      || value.expiresAt <= Date.now()
    ) {
      return "";
    }
    return value.email;
  } catch {
    return "";
  }
}

export function rememberConfirmationEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;
  const value: StoredConfirmationEmail = {
    email: normalizedEmail,
    expiresAt: Date.now() + lifetimeMs,
  };
  try {
    storage()?.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Confirmation still works from URL or manual input when storage is unavailable.
  }
}

export function clearConfirmationEmail() {
  try {
    storage()?.removeItem(storageKey);
  } catch {
    // Confirmation success must not be blocked by browser storage errors.
  }
}

export function subscribeToConfirmationEmail(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
