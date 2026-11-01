import assert from "node:assert/strict";
import test from "node:test";

import { formatCustomerDateTime, parseBackendDate } from "../lib/user-format";

test("Backend UTC timestamp without timezone is not interpreted as Vietnam local time", () => {
  const parsed = parseBackendDate("2026-10-23T03:00:00");

  assert.equal(parsed?.toISOString(), "2026-10-23T03:00:00.000Z");
  assert.equal(formatCustomerDateTime("2026-10-23T03:00:00"), "10:00 23/10/2026");
});

test("Backend timestamps with an explicit timezone are preserved", () => {
  assert.equal(
    parseBackendDate("2026-10-23T03:00:00+07:00")?.toISOString(),
    "2026-10-22T20:00:00.000Z",
  );
});
