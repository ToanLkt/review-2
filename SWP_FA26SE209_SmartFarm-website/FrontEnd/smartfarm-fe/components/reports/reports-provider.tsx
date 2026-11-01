"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminReportsService } from "@/lib/api/admin/admin-reports-instance";
import type { HarvestReport, InventoryReport, RevenueReport } from "@/lib/api/admin/admin-reports-service";
import { dayKey } from "@/lib/formatters";

type ReportsContextValue = {
  from: string; to: string; setFrom: (value: string) => void; setTo: (value: string) => void;
  revenue: RevenueReport | null; harvest: HarvestReport | null; inventory: InventoryReport | null;
  loading: boolean; error: string; reload: () => void;
};
const ReportsContext = createContext<ReportsContextValue | null>(null);
const dateInput = dayKey;

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [from, setFrom] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 30); return dateInput(date); });
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [harvest, setHarvest] = useState<HarvestReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!from || !to || from > to) return;
    setLoading(true); setError("");
    try {
      const range = { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59.999`) };
      const [nextRevenue, nextHarvest, nextInventory] = await Promise.all([
        adminReportsService.revenue(range), adminReportsService.harvest(range), adminReportsService.inventory(),
      ]);
      setRevenue(nextRevenue); setHarvest(nextHarvest); setInventory(nextInventory);
    } catch { setError("Không thể tải dữ liệu báo cáo. Vui lòng thử lại."); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { const id = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(id); }, [load]);
  const value = useMemo(() => ({ from, to, setFrom, setTo, revenue, harvest, inventory, loading, error, reload: () => { void load(); } }), [from, to, revenue, harvest, inventory, loading, error, load]);
  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const value = useContext(ReportsContext);
  if (!value) throw new Error("useReports must be used within ReportsProvider");
  return value;
}
