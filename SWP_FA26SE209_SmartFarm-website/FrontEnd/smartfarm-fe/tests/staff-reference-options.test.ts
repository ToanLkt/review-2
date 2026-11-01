import assert from "node:assert/strict";
import test from "node:test";
import { collectPages, loadReferenceOptions } from "@/lib/api/staff/staff-reference-options";
import { staffOrdersService } from "@/lib/api/staff/staff-orders-instance";
import { staffFarmService } from "@/lib/api/staff/staff-farm-instance";
import type { StaffOrder } from "@/lib/api/staff/staff-orders-service";

test("reference options include every backend page", async () => {
  const calls: number[] = [];
  const items = await collectPages(async page => {
    calls.push(page);
    return { items: [`item-${page}`], totalPages: 3 };
  });
  assert.deepEqual(calls, [1, 2, 3]);
  assert.deepEqual(items, ["item-1", "item-2", "item-3"]);
});

test("reference loading reports errors instead of returning partial choices", async () => {
  await assert.rejects(collectPages(async page => {
    if (page === 2) throw new Error("Network unavailable");
    return { items: [1], totalPages: 2 };
  }), /Network unavailable/);
});

test("available tray choices use business codes, retain IDs only as values", async t => {
  t.mock.method(staffFarmService, "trays", async (query: unknown) => {
    assert.deepEqual(query, { status: "AVAILABLE" });
    return [{ soilTrayId: 9123, trayCode: "KHAY-A", tierIndex: 2 }];
  });
  assert.deepEqual(await loadReferenceOptions("availableTray"), [{ value: "9123", label: "KHAY-A · tầng 2" }]);
});

test("delivery rental choices are restricted to the selected order", async t => {
  t.mock.method(staffOrdersService, "get", async (id: number) => {
    assert.equal(id, 34);
    return { orderCode: "DH-A", customerName: "Nguyễn An", rentals: [{ trayRentalId: 9234, trayCode: "KHAY-B" }] } as StaffOrder;
  });
  assert.deepEqual(await loadReferenceOptions("rental", "34"), [{ value: "9234", label: "DH-A · KHAY-B · Nguyễn An" }]);
});

test("order choice carries customer identity internally without showing database IDs", async t => {
  t.mock.method(staffOrdersService, "list", async (query: { status?: string }) => {
    assert.equal(query.status, "CONFIRMED");
    return { items: [{ orderId: 12345, orderCode: "DH-A", customerId: 98765, customerName: "Nguyễn An" }], totalPages: 1 };
  });
  assert.deepEqual(await loadReferenceOptions("confirmedOrder"), [{ value: "12345", label: "DH-A · Nguyễn An", customerId: 98765, customerName: "Nguyễn An" }]);
});

test("a new growing cycle cannot select an unpaid rental order", async t => {
  t.mock.method(staffOrdersService, "list", async () => ({
    items: [
      { orderId: 1, orderCode: "CHUA-THANH-TOAN", customerId: 9, customerName: "An", status: "AWAITING_PAYMENT" },
      { orderId: 2, orderCode: "DA-XAC-NHAN", customerId: 9, customerName: "An", status: "CONFIRMED" },
    ], totalPages: 1,
  }));
  const choices = await loadReferenceOptions("rentalOrder");
  assert.deepEqual(choices.map(choice => choice.label), ["DA-XAC-NHAN · An"]);
});
