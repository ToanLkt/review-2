import assert from "node:assert/strict";
import test from "node:test";

import type { RentalCart, RentalCartItem } from "@/lib/api/rental-cart-service";
import {
  summarizeRentalCartSelection,
  synchronizeRentalCartSelection,
} from "@/lib/rental-cart-selection";

function item(cartItemId: number, lineTotal: number): RentalCartItem {
  return {
    cartItemId,
    seedVarietyId: cartItemId,
    seedVarietyName: `Seed ${cartItemId}`,
    farmAreaId: null,
    farmAreaName: null,
    quantity: 1,
    totalCycles: 1,
    targetPlantingDate: null,
    rentalPrice: lineTotal,
    lineTotal,
    addedAt: "2026-10-30T00:00:00Z",
  };
}

const items = [item(11, 85_000), item(12, 65_000), item(13, 55_000)];
const cart: RentalCart = {
  cartId: 1,
  items,
  itemCount: 3,
  subtotal: 205_000,
  discountPercent: 10,
  discountAmount: 20_500,
  total: 184_500,
};

test("selection summary only prices selected cart item IDs", () => {
  const summary = summarizeRentalCartSelection(cart, new Set([11, 13]));

  assert.deepEqual(summary.items.map((entry) => entry.cartItemId), [11, 13]);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.subtotal, 140_000);
  assert.equal(summary.discountAmount, 14_000);
  assert.equal(summary.total, 126_000);
});

test("empty selection has zero totals", () => {
  assert.deepEqual(summarizeRentalCartSelection(cart, new Set()), {
    items: [],
    itemCount: 0,
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    total: 0,
  });
});

test("selection synchronization preserves choices, removes missing IDs, and selects new IDs", () => {
  const synchronized = synchronizeRentalCartSelection(
    new Set([11, 13]),
    new Set([11, 12, 13]),
    [items[0], items[1], item(14, 40_000)],
  );

  assert.deepEqual([...synchronized], [11, 14]);
});
