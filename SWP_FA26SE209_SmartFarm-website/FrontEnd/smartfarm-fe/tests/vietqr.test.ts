import assert from "node:assert/strict";
import test from "node:test";

import { buildVietQrImageUrl } from "../lib/vietqr";

test("VietQR uses the verified TPBank BIN and Payment API values", () => {
  const url = buildVietQrImageUrl({
    bankBin: "970423",
    bankAccountNumber: "0123456789",
    accountName: "SMARTFARM",
    amount: 170_000,
    paymentCode: "TR20261023123456789",
  });

  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/image/970423-0123456789-compact2.svg");
  assert.equal(parsed.searchParams.get("amount"), "170000");
  assert.equal(parsed.searchParams.get("addInfo"), "TR20261023123456789");
  assert.equal(parsed.searchParams.get("accountName"), "SMARTFARM");
});

test("VietQR falls back instead of guessing an unknown or invalid bank", () => {
  const base = {
    bankAccountNumber: "0123456789",
    accountName: "SMARTFARM",
    amount: 170_000,
    paymentCode: "TR20261023123456789",
  };

  assert.equal(buildVietQrImageUrl({ ...base, bankBin: null }), null);
  assert.equal(buildVietQrImageUrl({ ...base, bankBin: "970423", paymentCode: "Mã có ký tự lạ" }), null);
  assert.equal(buildVietQrImageUrl({ ...base, bankBin: "970423", amount: 0 }), null);
  assert.equal(buildVietQrImageUrl({ ...base, bankBin: "970423", amount: 170000.5 }), null);
});
