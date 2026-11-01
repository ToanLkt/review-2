import assert from "node:assert/strict";
import test from "node:test";
import { activeSeedCartItems, addCartItem, cartSubtotal, changeCartQuantity, type UserCartItem } from "../lib/user-cart";
import { validateMockSignUp } from "../lib/auth";
import { getTraySummary, userTrays } from "../lib/user-trays";
import { demoTrayCapacity, isValidTrayQuantity, remainingTrayCapacity } from "../lib/tray-capacity";

test("giỏ hạt giống cộng dồn và giữ số lượng tối thiểu mà không tự cộng phí", () => {
  const seed: UserCartItem = { id: "seed-1", type: "seed", name: "Rau muống", image: "", price: 0, qty: 1, seedId: "1", backendPricePending: true };
  const doubled = addCartItem([seed], seed);
  assert.equal(doubled[0].qty, 2);
  assert.equal(changeCartQuantity(doubled, seed.id, -10)[0].qty, 1);
  assert.equal(cartSubtotal(doubled), 0);
});

test("Seed Packet Cart bỏ qua dữ liệu legacy và không giữ giá cũ trong localStorage", () => {
  const seed = { id: "seed-1", type: "seed" as const, name: "Rau muống", image: "", price: 85_000, qty: 1, seedId: "1" };
  const rental = { ...seed, id: "tray-old", type: "tray" as const };
  assert.deepEqual(activeSeedCartItems([seed, rental]), [{ ...seed, price: 0, backendPricePending: true }]);
});

test("KPI khay được tính từ cùng dữ liệu danh sách", () => {
  assert.deepEqual(getTraySummary(userTrays), { total: 3, growing: 2, ready: 1, averageTemp: 23.5 });
});

test("đăng ký mock kiểm tra các trường bắt buộc", () => {
  assert.deepEqual(validateMockSignUp({ name: "Ngọc Anh", email: "user@smartfarm.vn", phone: "0901234567", password: "Password123" }), {});
  const errors = validateMockSignUp({ name: "", email: "sai", phone: "123", password: "123" });
  assert.deepEqual(Object.keys(errors).sort(), ["email", "name", "password", "phone"]);
});

test("capacity demo chặn số khay vượt tồn", () => {
  assert.equal(isValidTrayQuantity(demoTrayCapacity.available), true);
  assert.equal(isValidTrayQuantity(demoTrayCapacity.available + 1), false);
  assert.equal(isValidTrayQuantity(0), false);
  assert.equal(remainingTrayCapacity([{ status: "Pending", items: [{ type: "tray", qty: 1, trayQuantity: 3 }] }, { status: "Paid", items: [{ type: "tray", qty: 1, trayQuantity: 3 }] }]), demoTrayCapacity.available - 3);
});
