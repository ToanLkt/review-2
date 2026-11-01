import type { AuthTokens } from "./types";

export type TokenPersistence = "session" | "local";

export type StoredAuthSession = {
  refreshToken: string;
  expiresAt: string | null;
};

export type TokenStore = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getExpiresAt: () => string | null;
  getPersistence: () => TokenPersistence;
  setTokens: (tokens: AuthTokens, persistence?: TokenPersistence) => void;
  clear: () => void;
};

const storageKey = "smartfarm_customer_auth";
const refreshLockName = "smartfarm_customer_auth_refresh";

let memoryAccessToken: string | null = null;
let memoryPersistence: TokenPersistence = "session";

function browserStorage(type: TokenPersistence): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return type === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readStoredSession(): {
  session: StoredAuthSession | null;
  persistence: TokenPersistence;
} {
  for (const persistence of ["session", "local"] as const) {
    const storage = browserStorage(persistence);
    if (!storage) continue;

    try {
      const raw = storage.getItem(storageKey);
      if (!raw) continue;

      const value: unknown = JSON.parse(raw);
      if (
        typeof value === "object" &&
        value !== null &&
        "refreshToken" in value &&
        typeof value.refreshToken === "string" &&
        value.refreshToken.length > 0
      ) {
        return {
          session: {
            refreshToken: value.refreshToken,
            expiresAt:
              "expiresAt" in value && typeof value.expiresAt === "string"
                ? value.expiresAt
                : null,
          },
          persistence,
        };
      }
    } catch {
      storage.removeItem(storageKey);
    }
  }

  return { session: null, persistence: memoryPersistence };
}

function clearBrowserStorage() {
  browserStorage("session")?.removeItem(storageKey);
  browserStorage("local")?.removeItem(storageKey);
}

export function withTokenRefreshLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return (async () => {
      let result!: T;
      await navigator.locks.request(refreshLockName, async () => {
        result = await operation();
      });
      return result;
    })();
  }
  return operation();
}

export const tokenStorage: TokenStore = {
  getAccessToken: () => memoryAccessToken,
  getRefreshToken: () => readStoredSession().session?.refreshToken ?? null,
  getExpiresAt: () => readStoredSession().session?.expiresAt ?? null,
  getPersistence: () => readStoredSession().persistence,
  setTokens: (tokens, persistence = "session") => {
    memoryAccessToken = tokens.accessToken;
    memoryPersistence = persistence;

    const session: StoredAuthSession = {
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    const targetStorage = browserStorage(persistence);
    const otherStorage = browserStorage(persistence === "local" ? "session" : "local");
    try {
      targetStorage?.setItem(storageKey, JSON.stringify(session));
      otherStorage?.removeItem(storageKey);
    } catch {
      // The access token remains available in memory for the current page.
    }
  },
  clear: () => {
    memoryAccessToken = null;
    memoryPersistence = "session";
    clearBrowserStorage();
  },
};
