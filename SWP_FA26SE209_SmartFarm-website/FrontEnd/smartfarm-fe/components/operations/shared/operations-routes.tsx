"use client";

import { createContext, useContext, type ReactNode } from "react";

export type OperationsRoutes = {
  trays: string;
  cycles: string;
  orders: string;
  monitoring: string;
  readOnly: boolean;
};

const adminRoutes: OperationsRoutes = {
  trays: "/admin/trays",
  cycles: "/admin/trays?tab=cycles",
  orders: "/admin/orders",
  monitoring: "/admin/iot",
  readOnly: false,
};

export const staffOperationsRoutes: OperationsRoutes = {
  trays: "/staff/trays",
  cycles: "/staff/trays?tab=cycles",
  orders: "/staff/orders",
  monitoring: "/staff/iot",
  readOnly: true,
};

const Context = createContext<OperationsRoutes>(adminRoutes);

export function OperationsRoutesProvider({
  children,
  routes,
}: {
  children: ReactNode;
  routes: OperationsRoutes;
}) {
  return <Context.Provider value={routes}>{children}</Context.Provider>;
}

export function useOperationsRoutes() {
  return useContext(Context);
}

export function withOperationsQuery(
  path: string,
  query: Record<string, string | undefined>,
) {
  const [pathname, current = ""] = path.split("?");
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) params.delete(key);
    else params.set(key, value);
  }
  const value = params.toString();
  return value ? `${pathname}?${value}` : pathname;
}
