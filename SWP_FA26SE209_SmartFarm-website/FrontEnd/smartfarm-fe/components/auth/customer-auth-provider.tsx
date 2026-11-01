"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { ApiError, authService } from "@/lib/api";
import { clearLegacyCustomerSession } from "@/lib/auth";
import { customerSession, isCustomerUser } from "@/lib/customer-session";
import type { UserResponse } from "@/lib/api";

type AuthContextValue = {
  user: UserResponse | null;
  status: "loading" | "authenticated" | "anonymous";
  refreshSession: () => Promise<UserResponse | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isDefinitiveAuthFailure(error: unknown) {
  return error instanceof ApiError && [400, 401, 403].includes(error.status);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(
    customerSession.subscribe,
    customerSession.getUser,
    () => null,
  );
  const [initialized, setInitialized] = useState(false);

  const refreshSession = useCallback(async () => {
    if (!authService.hasSession()) {
      authService.clearSession();
      setInitialized(true);
      return null;
    }

    try {
      const restoredUser = await authService.restoreSession();
      setInitialized(true);
      return restoredUser;
    } catch (error) {
      if (isDefinitiveAuthFailure(error)) {
        authService.clearSession();
        setInitialized(true);
        return null;
      }
      setInitialized(false);
      throw error;
    }
  }, []);

  useEffect(() => {
    clearLegacyCustomerSession();
    let active = true;
    let retryTimer: number | undefined;

    async function restore() {
      try {
        await refreshSession();
      } catch {
        if (active) retryTimer = window.setTimeout(() => void restore(), 3_000);
      }
    }

    queueMicrotask(() => {
      if (active) void restore();
    });
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setInitialized(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status: !initialized
      ? "loading"
      : user
        ? "authenticated"
        : "anonymous",
    refreshSession,
    logout,
  }), [initialized, logout, refreshSession, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

export function useCustomerAuth(): AuthContextValue {
  const context = useAuth();
  const customer = isCustomerUser(context.user);
  return {
    ...context,
    user: customer ? context.user : null,
    status: context.status === "loading"
      ? "loading"
      : customer
        ? "authenticated"
        : "anonymous",
  };
}
