import type { RentalCart, RentalCartItem } from "@/lib/api/rental-cart-service";

export type RentalCartSelectionSummary = {
  items: RentalCartItem[];
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function synchronizeRentalCartSelection(
  selectedIds: ReadonlySet<number>,
  previousCartIds: ReadonlySet<number>,
  items: readonly RentalCartItem[],
) {
  return new Set(
    items
      .map((item) => item.cartItemId)
      .filter((cartItemId) => selectedIds.has(cartItemId) || !previousCartIds.has(cartItemId)),
  );
}

export function summarizeRentalCartSelection(
  cart: RentalCart,
  selectedIds: ReadonlySet<number>,
): RentalCartSelectionSummary {
  const items = (cart.items ?? []).filter((item) => selectedIds.has(item.cartItemId));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountPercent = items.length > 0 ? cart.discountPercent : 0;
  const discountAmount = roundCurrency(subtotal * discountPercent / 100);

  return {
    items,
    itemCount: items.length,
    subtotal,
    discountPercent,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
