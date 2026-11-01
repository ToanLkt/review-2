import type { SeedVariety } from "./api/seed-service";

export type UserCartItem = {
  id: string;
  type: "seed" | "tray";
  name: string;
  image: string;
  price: number;
  qty: number;
  seedId?: string;
  backendPricePending?: boolean;
};

export const cartStorageKey = "smartfarm_user_cart";

export const initialCartItems: UserCartItem[] = [];

export function activeSeedCartItems(value: unknown): UserCartItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): UserCartItem[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<UserCartItem>;
    const valid = candidate.type === "seed"
      && typeof candidate.id === "string"
      && typeof candidate.name === "string"
      && typeof candidate.image === "string"
      && typeof candidate.price === "number"
      && typeof candidate.qty === "number"
      && typeof candidate.seedId === "string"
      && Number.isInteger(Number(candidate.seedId))
      && Number(candidate.seedId) > 0;
    if (!valid) return [];
    return [{
      ...candidate as UserCartItem,
      price: 0,
      backendPricePending: true,
    }];
  });
}

export function cartSubtotal(items: UserCartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.qty, 0);
}

export function addCartItem(items: UserCartItem[], item: UserCartItem): UserCartItem[] {
  const existing = items.find((entry) => entry.id === item.id);
  return existing
    ? items.map((entry) => entry.id === item.id ? { ...entry, qty: entry.qty + item.qty } : entry)
    : [...items, item];
}

export function changeCartQuantity(items: UserCartItem[], id: string, delta: number): UserCartItem[] {
  return items.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item);
}

export function seedPacketCartItem(seed: SeedVariety, qty = 1): UserCartItem {
  const hasValidSalePrice = Number.isFinite(seed.salePricePerPacket) && seed.salePricePerPacket > 0;
  return {
    id: `seed-${seed.seedVarietyId}`,
    type: "seed",
    name: seed.name ?? `Giống cây #${seed.seedVarietyId}`,
    image: "",
    price: hasValidSalePrice ? seed.salePricePerPacket : 0,
    qty,
    seedId: String(seed.seedVarietyId),
    backendPricePending: !hasValidSalePrice,
  };
}
