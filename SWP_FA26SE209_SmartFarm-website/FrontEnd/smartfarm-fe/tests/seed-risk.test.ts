import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSeedRiskDescription } from "@/lib/seed-risk";

test("seed risk keeps backend content and removes surrounding whitespace", () => {
  assert.equal(normalizeSeedRiskDescription("  Tránh tưới quá nhiều.\nGiữ khay thông thoáng.  "), "Tránh tưới quá nhiều.\nGiữ khay thông thoáng.");
});

test("seed risk hides null, empty and whitespace-only values", () => {
  assert.equal(normalizeSeedRiskDescription(null), null);
  assert.equal(normalizeSeedRiskDescription(""), null);
  assert.equal(normalizeSeedRiskDescription("   "), null);
});

test("different seed risks remain independent", () => {
  const risks = ["Giữ ẩm vừa phải", "Hạn chế ánh sáng trực tiếp"].map(normalizeSeedRiskDescription);
  assert.deepEqual(risks, ["Giữ ẩm vừa phải", "Hạn chế ánh sáng trực tiếp"]);
});
