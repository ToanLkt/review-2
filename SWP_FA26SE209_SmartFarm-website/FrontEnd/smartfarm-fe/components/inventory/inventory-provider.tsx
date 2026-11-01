"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  initialMaterials,
  initialTransactions,
  validateMaterial,
  validateImport,
  validateExport,
  type Material,
  type MaterialDraft,
  type MaterialErrors,
  type Transaction,
  type ImportExportErrors,
} from "@/lib/inventory";

function useInventoryState() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [transactions, setTransactions] = useState(initialTransactions);
  const matRef = useRef(materials);
  const txRef = useRef(transactions);

  function nextTxId() {
    return (
      "tx-" +
      (Math.max(0, ...txRef.current.map((t) => Number(t.id.split("-")[1]))) +
        1)
    );
  }

  function nextCode(prefix: string) {
    const nums = txRef.current
      .filter((t) => t.code.startsWith(prefix))
      .map((t) => Number(t.code.split("-")[1]));
    return prefix + String(Math.max(0, ...nums) + 1).padStart(3, "0");
  }

  function importStock(
    materialId: string,
    quantity: number,
    txDate: string,
    supplier: string,
    performer: string,
  ): ImportExportErrors {
    const errors = validateImport(materialId, quantity, txDate);
    if (Object.keys(errors).length) return errors;

    const mat = matRef.current.find((m) => m.id === materialId);
    if (!mat) return { form: "Không tìm thấy vật tư." };

    const nextMats = matRef.current.map((m) =>
      m.id === materialId
        ? {
            ...m,
            stock: m.stock + quantity,
            available: m.available + quantity,
          }
        : m,
    );
    matRef.current = nextMats;
    setMaterials(nextMats);

    const tx: Transaction = {
      id: nextTxId(),
      code: nextCode("PN-"),
      type: "Nhập kho",
      materialId,
      materialName: mat.name,
      quantity,
      unit: mat.unit,
      reason: supplier || "—",
      performer: performer || "—",
      date: txDate,
    };
    const nextTxs = [tx, ...txRef.current];
    txRef.current = nextTxs;
    setTransactions(nextTxs);

    toast.success(`Đã nhập ${quantity} ${mat.unit} ${mat.name}.`);
    return {};
  }

  function exportStock(
    materialId: string,
    quantity: number,
    txDate: string,
    reason: string,
    performer: string,
  ): ImportExportErrors {
    const mat = matRef.current.find((m) => m.id === materialId);
    const errors = validateExport(
      materialId,
      quantity,
      mat?.available ?? 0,
      txDate,
    );
    if (Object.keys(errors).length) return errors;
    if (!mat) return { form: "Không tìm thấy vật tư." };

    const nextMats = matRef.current.map((m) =>
      m.id === materialId
        ? {
            ...m,
            stock: m.stock - quantity,
            available: m.available - quantity,
          }
        : m,
    );
    matRef.current = nextMats;
    setMaterials(nextMats);

    const tx: Transaction = {
      id: nextTxId(),
      code: nextCode("PX-"),
      type: "Xuất dùng",
      materialId,
      materialName: mat.name,
      quantity: -quantity,
      unit: mat.unit,
      reason: reason || "—",
      performer: performer || "—",
      date: txDate,
    };
    const nextTxs = [tx, ...txRef.current];
    txRef.current = nextTxs;
    setTransactions(nextTxs);

    toast.success(`Đã xuất ${quantity} ${mat.unit} ${mat.name}.`);
    return {};
  }

  function updateMaterial(
    id: string,
    draft: MaterialDraft,
  ): MaterialErrors {
    const errors = validateMaterial(draft);
    if (Object.keys(errors).length) return errors;

    const nextMats = matRef.current.map((m) =>
      m.id === id
        ? {
            ...m,
            name: draft.name.trim(),
            group: draft.group,
            unit: draft.unit.trim(),
            minThreshold: draft.minThreshold,
            note: draft.note.trim(),
          }
        : m,
    );
    matRef.current = nextMats;
    setMaterials(nextMats);
    toast.success("Đã cập nhật thông tin vật tư.");
    return {};
  }

  return { materials, transactions, importStock, exportStock, updateMaterial };
}

const Context = createContext<ReturnType<typeof useInventoryState> | null>(
  null,
);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const value = useInventoryState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInventory() {
  const c = useContext(Context);
  if (!c) throw new Error("Thiếu InventoryProvider");
  return c;
}
