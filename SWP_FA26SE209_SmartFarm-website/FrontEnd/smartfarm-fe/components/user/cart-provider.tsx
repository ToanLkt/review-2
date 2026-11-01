"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { activeSeedCartItems, addCartItem, cartStorageKey, changeCartQuantity, type UserCartItem } from "@/lib/user-cart";
import { seedService } from "@/lib/api";

type CartContextValue = {
  items: UserCartItem[];
  addItem: (item: UserCartItem) => void;
  changeQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  refreshSeedPrices: () => Promise<UserCartItem[]>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<UserCartItem[]>([]);
  const itemsRef = useRef<UserCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(cartStorageKey);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          setItems(activeSeedCartItems(parsed));
        }
      } catch { /* Cart stays empty when storage is unavailable. */ }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    itemsRef.current = items;
    try { localStorage.setItem(cartStorageKey, JSON.stringify(items)); } catch { /* Cart stays usable in memory. */ }
  }, [hydrated, items]);

  const refreshSeedPrices = useCallback(async () => {
    const snapshot = itemsRef.current;
    const updated = await Promise.all(snapshot.map(async (item) => {
      if (item.type !== "seed" || !item.seedId) return item;
      const seed = await seedService.getSeedVariety(Number(item.seedId));
      const price = seed.salePricePerPacket;
      if (!Number.isFinite(price) || price <= 0) {
        return { ...item, price: 0, backendPricePending: true };
      }
      return { ...item, name: seed.name ?? item.name, price, backendPricePending: false };
    }));
    setItems(updated);
    return updated;
  }, []);

  return <CartContext.Provider value={{
    items,
    addItem: (item) => setItems((current) => item.type === "seed" && !current.some((entry) => entry.type === "seed" && entry.seedId !== item.seedId) ? addCartItem(current, item) : current),
    changeQuantity: (id, delta) => setItems((current) => changeCartQuantity(current, id, delta)),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clearCart: () => setItems([]),
    refreshSeedPrices,
  }}>{children}</CartContext.Provider>;
}

export function useUserCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useUserCart requires CartProvider");
  return context;
}
