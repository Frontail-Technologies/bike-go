import { describe, expect, test } from "bun:test";
import { periodsOverlap, rentalDays } from "../src/libs/date";
import { requestHash, stableStringify } from "../src/libs/hash";
import { addMinor, formatMinor, multiplyMinor, percentOfMinor, toMinor } from "../src/libs/money";
import { pageMeta, pageOf } from "../src/libs/pagination";
import { REFERENCE_PATTERN, newReference } from "../src/libs/reference";

describe("money", () => {
  test("arithmetic stays exact in integers", () => {
    expect(addMinor(10, 20, 30)).toBe(60);
    expect(multiplyMinor(2500, 3)).toBe(7500);
    expect(() => addMinor(0.1, 0.2)).toThrow();
  });
  test("percentages round half up", () => {
    expect(percentOfMinor(10_000, 1800)).toBe(1800);
    expect(percentOfMinor(1, 5000)).toBe(1); // 0.5 rounds up
    expect(percentOfMinor(333, 1000)).toBe(33); // 33.3
    expect(percentOfMinor(9_000_000_000_000, 1800)).toBe(1_620_000_000_000); // beyond float-safe multiplication
  });
  test("decimal strings convert without floats", () => {
    expect(toMinor("12.50", "USD")).toBe(1250);
    expect(toMinor("0.1", "USD")).toBe(10);
    expect(() => toMinor("1.234", "USD")).toThrow();
    expect(formatMinor(1250, "USD")).toBe("$12.50");
  });
});

describe("dates", () => {
  test("rental days round up in 24-hour blocks", () => {
    const start = new Date("2026-11-01T10:00:00Z");
    expect(rentalDays(start, new Date("2026-11-01T18:00:00Z"))).toBe(1);
    expect(rentalDays(start, new Date("2026-11-02T10:00:00Z"))).toBe(1);
    expect(rentalDays(start, new Date("2026-11-02T10:00:01Z"))).toBe(2);
    expect(rentalDays(start, new Date("2026-11-04T10:00:00Z"))).toBe(3);
    expect(() => rentalDays(start, start)).toThrow();
  });
  test("back-to-back periods do not overlap", () => {
    const a = new Date("2026-11-01T10:00:00Z");
    const b = new Date("2026-11-02T10:00:00Z");
    const c = new Date("2026-11-03T10:00:00Z");
    expect(periodsOverlap(a, b, b, c)).toBe(false);
    expect(periodsOverlap(a, c, b, c)).toBe(true);
  });
});

describe("hash, reference, pagination", () => {
  test("equal payloads hash equally whatever the key order", () => {
    expect(requestHash({ a: 1, b: { c: 2, d: [3, 4] } })).toBe(requestHash({ b: { d: [3, 4], c: 2 }, a: 1 }));
    expect(requestHash({ a: 1 })).not.toBe(requestHash({ a: 2 }));
    expect(stableStringify({ a: undefined, b: 1 })).toBe('{"b":1}');
  });
  test("references match the public format", () => {
    for (let i = 0; i < 50; i++) expect(newReference("RG")).toMatch(REFERENCE_PATTERN);
    expect(newReference("LN").startsWith("LN")).toBe(true);
  });
  test("pagination clamps and reports totals", () => {
    expect(pageOf({})).toMatchObject({ page: 1, pageSize: 20, offset: 0 });
    expect(pageOf({ page: 3, pageSize: 500 })).toMatchObject({ pageSize: 100, offset: 200 });
    expect(pageMeta({ page: 1, pageSize: 20 }, 41)).toEqual({ page: 1, pageSize: 20, total: 41, totalPages: 3 });
  });
});
