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
  initialProducts,
  initialBatches,
  validateProduct,
  type Product,
  type Batch,
  type ProductDraft,
  type ProductErrors,
} from "@/lib/products";

function useProductsState() {
  const [products, setProducts] = useState(initialProducts);
  const [batches] = useState(initialBatches);
  const current = useRef(products);

  function save(draft: ProductDraft, id?: string): ProductErrors {
    const errors = validateProduct(draft, current.current, id);
    if (Object.keys(errors).length) return errors;

    const item: Product = {
      id:
        id ??
        "prod-" +
          (Math.max(
            0,
            ...current.current.map((p) => Number(p.id.split("-")[1])),
          ) +
            1),
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      category: draft.category,
      description: draft.description.trim(),
      weight: draft.weight,
      price: draft.price,
      actualStock: id
        ? (current.current.find((p) => p.id === id)?.actualStock ?? 0)
        : 0,
      reserved: id
        ? (current.current.find((p) => p.id === id)?.reserved ?? 0)
        : 0,
      available: id
        ? (current.current.find((p) => p.id === id)?.available ?? 0)
        : 0,
      status: draft.status,
      storageInstruction: draft.storageInstruction.trim(),
    };

    const next = id
      ? current.current.map((p) => (p.id === id ? item : p))
      : [...current.current, item];
    current.current = next;
    setProducts(next);
    toast.success(id ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.");
    return {};
  }

  function updateStatus(id: string, status: Product["status"]) {
    const next = current.current.map((p) =>
      p.id === id ? { ...p, status } : p,
    );
    current.current = next;
    setProducts(next);
    toast.success("Đã cập nhật trạng thái sản phẩm.");
  }

  return { products, batches, save, updateStatus };
}

const Context = createContext<ReturnType<typeof useProductsState> | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const value = useProductsState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useProducts() {
  const c = useContext(Context);
  if (!c) throw new Error("Thiếu ProductsProvider");
  return c;
}
