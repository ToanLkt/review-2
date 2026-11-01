"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  initialEnvironmentThresholds,
  initialFarmSettings,
  initialLoginSessions,
  initialNotificationSettings,
  initialSalesSettings,
  type EnvironmentThresholds,
  type FarmSettings,
  type LoginSession,
  type NotificationSettings,
  type SalesSettings,
} from "@/lib/settings";

interface SettingsContextValue {
  farm: FarmSettings;
  setFarm: Dispatch<SetStateAction<FarmSettings>>;
  notifications: NotificationSettings;
  setNotifications: Dispatch<SetStateAction<NotificationSettings>>;
  thresholds: EnvironmentThresholds;
  setThresholds: Dispatch<SetStateAction<EnvironmentThresholds>>;
  sales: SalesSettings;
  setSales: Dispatch<SetStateAction<SalesSettings>>;
  sessions: LoginSession[];
  removeSession: (id: string) => void;
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: Dispatch<SetStateAction<boolean>>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState(initialFarmSettings);
  const [notifications, setNotifications] = useState(
    initialNotificationSettings,
  );
  const [thresholds, setThresholds] = useState(initialEnvironmentThresholds);
  const [sales, setSales] = useState(initialSalesSettings);
  const [sessions, setSessions] = useState(initialLoginSessions);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const value = useMemo<SettingsContextValue>(
    () => ({
      farm,
      setFarm,
      notifications,
      setNotifications,
      thresholds,
      setThresholds,
      sales,
      setSales,
      sessions,
      removeSession: (id) =>
        setSessions((current) =>
          current.filter((session) => session.current || session.id !== id),
        ),
      twoFactorEnabled,
      setTwoFactorEnabled,
    }),
    [
      farm,
      notifications,
      thresholds,
      sales,
      sessions,
      twoFactorEnabled,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("useSettings phải được dùng bên trong SettingsProvider.");
  return context;
}
