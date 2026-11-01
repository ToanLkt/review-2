import assert from "node:assert/strict";
import test, { after } from "node:test";

import {
  clearConfirmationEmail,
  readConfirmationEmail,
  rememberConfirmationEmail,
} from "@/lib/confirmation-email-storage";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const localStorage = new MemoryStorage();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { localStorage },
});

after(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("confirmation email storage keeps only a normalized, temporary email", () => {
  rememberConfirmationEmail(" Customer@SmartFarm.vn ");

  const key = localStorage.key(0);
  assert.ok(key);
  const raw = localStorage.getItem(key);
  assert.ok(raw);
  const stored = JSON.parse(raw) as Record<string, unknown>;
  assert.deepEqual(Object.keys(stored).sort(), ["email", "expiresAt"]);
  assert.equal(stored.email, "customer@smartfarm.vn");
  assert.equal(readConfirmationEmail(), "customer@smartfarm.vn");

  clearConfirmationEmail();
  assert.equal(readConfirmationEmail(), "");
});

test("expired confirmation email is ignored", () => {
  rememberConfirmationEmail("customer@smartfarm.vn");
  const key = localStorage.key(0);
  assert.ok(key);
  localStorage.setItem(key, JSON.stringify({
    email: "customer@smartfarm.vn",
    expiresAt: Date.now() - 1,
  }));

  assert.equal(readConfirmationEmail(), "");
});
