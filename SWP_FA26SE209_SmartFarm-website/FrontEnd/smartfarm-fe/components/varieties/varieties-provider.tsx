"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { staffCultivationService } from "@/lib/api/staff/staff-cultivation-instance";
import type { CultivationSupply, SupplyRequest } from "@/lib/api/staff/staff-cultivation-service";
import { validateVariety, type Variety, type VarietyDraft, type VarietyErrors } from "@/lib/varieties";

function toVariety(supply: CultivationSupply): Variety {
  return {
    id: String(supply.supplyId), code: `SEED-${supply.supplyId}`,
    name: supply.supplyName, description: supply.description ?? "",
    referenceGrowthDays: supply.harvestDays, enabledForNewRentals: supply.isActive,
  };
}

function toRequest(draft: VarietyDraft, original?: CultivationSupply): SupplyRequest {
  return {
    supplyName: draft.name.trim(), supplyType: "SEED", description: draft.description.trim() || null,
    harvestDays: draft.referenceGrowthDays, isActive: draft.enabledForNewRentals,
    imageUrl: original?.imageUrl ?? null, costPrice: original?.costPrice ?? 0,
    unitPrice: original?.unitPrice ?? 0, rentalPrice: original?.rentalPrice ?? 0,
    quantityInStock: original?.quantityInStock ?? 0, unit: original?.unit ?? "g",
    minStockLevel: original?.minStockLevel ?? 0,
  };
}

function useCatalogState() {
  const [supplies, setSupplies] = useState<CultivationSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const catalog = supplies.map(toVariety);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setSupplies(await staffCultivationService.supplies({ type: "SEED" })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải giống rau."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  async function save(draft: VarietyDraft, id?: string): Promise<VarietyErrors> {
    const errors = validateVariety(draft, catalog, id);
    if (Object.keys(errors).length) return errors;
    const original = id ? supplies.find((s) => String(s.supplyId) === id) : undefined;
    if (id && !original) return { form: "Không tìm thấy giống rau." };
    try {
      const body = toRequest(draft, original);
      if (id) await staffCultivationService.updateSupply(Number(id), body);
      else await staffCultivationService.createSupply(body);
      await reload();
      toast.success(id ? "Đã cập nhật giống rau." : "Đã thêm giống rau.");
      return {};
    } catch (reason) {
      return { form: reason instanceof Error ? reason.message : "Không thể lưu giống rau." };
    }
  }

  async function setEnabled(id: string, enabled: boolean) {
    const original = supplies.find((s) => String(s.supplyId) === id);
    if (!original) { toast.error("Không tìm thấy giống rau."); return; }
    try {
      await staffCultivationService.updateSupply(Number(id), toRequest({ ...toVariety(original), enabledForNewRentals: enabled }, original));
      await reload();
      toast.success(enabled ? "Đã cho phép chọn khi thuê mới." : "Đã tắt chọn khi thuê mới.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật giống rau.");
    }
  }
  return { catalog, save, setEnabled, loading, error, reload };
}

const Context = createContext<ReturnType<typeof useCatalogState> | null>(null);
export function VarietiesProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useCatalogState()}>{children}</Context.Provider>;
}
export function useVarieties() {
  const value = useContext(Context);
  if (!value) throw new Error("Thiếu dữ liệu giống rau");
  return value;
}
