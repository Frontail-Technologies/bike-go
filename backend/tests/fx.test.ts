import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "../src/libs/db";
import { fxRates } from "../src/libs/db/schema";
import { convertMinor, parseRate } from "../src/libs/fx";
import { loanLimits } from "../src/routes/loan/rules";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { createDraft, draftBody } from "./helpers/loan";

const clear = async () => {
  await db.delete(fxRates);
};
beforeEach(clear);
afterAll(clear);

const record = (cookie: string, overrides: Record<string, unknown> = {}) =>
  postJson("/api/v1/admin/fx-rates", { baseCurrency: "USD", quoteCurrency: "KHR", rate: "4100", source: "Test central bank", effectiveAt: "2026-01-01T00:00:00Z", ...overrides }, { cookie });

describe("conversion maths (pure)", () => {
  test("rates parse exactly, without floats", () => {
    expect(parseRate("4100")).toBe(410_000_000_000n);
    expect(parseRate("4087.5")).toBe(408_750_000_000n);
    expect(parseRate("0.00024414")).toBe(24_414n);
    expect(() => parseRate("0")).toThrow();
    expect(() => parseRate("-1")).toThrow();
    expect(() => parseRate("4,100")).toThrow();
    expect(() => parseRate("1.123456789")).toThrow();
  });

  test("converts minor units across currencies and rounds half up", () => {
    expect(convertMinor(100_000, "USD", "KHR", "4100")).toBe(410_000_000);
    expect(convertMinor(1, "USD", "KHR", "4087.5")).toBe(4088);
    expect(convertMinor(410_000_000, "KHR", "USD", "0.00024390")).toBe(99_999);
    expect(convertMinor(0, "USD", "KHR", "4100")).toBe(0);
  });

  test("loan limits are native in USD whatever the rate, and derived only where no native limit exists", () => {
    const fx = { rate: "9999", source: "ignored for USD", effectiveAt: new Date("2026-01-01T00:00:00Z") };
    expect(loanLimits("personal", "USD", fx)).toEqual({ minMinor: 100_000, maxMinor: 2_500_000, maxTenure: 48, derivedFrom: null });
    expect(loanLimits("personal", "USD")).toEqual(loanLimits("personal", "USD", fx));
    const khr = loanLimits("personal", "KHR", { rate: "4000", source: "Bank", effectiveAt: new Date("2026-01-01T00:00:00Z") });
    expect(khr.maxMinor).toBe(2_500_000 * 4000);
    expect(khr.derivedFrom).toMatchObject({ rate: "4000", source: "Bank" });
    expect(() => loanLimits("personal", "KHR")).toThrow();
  });
});

describe("recording rates", () => {
  test("staff record a rate with its source and effective date, and can list it", async () => {
    const staff = await signInAdmin();
    const response = await record(staff.cookie, { rate: "4087.5", source: "National Bank of Cambodia", effectiveAt: "2026-02-03T08:00:00Z" });
    expect(response.status).toBe(200);
    const rate = (await json(response)).data;
    expect(rate).toMatchObject({ baseCurrency: "USD", quoteCurrency: "KHR", rate: "4087.50000000", source: "National Bank of Cambodia", effectiveAt: "2026-02-03T08:00:00.000Z" });

    const list = await json(await request("/api/v1/admin/fx-rates", { cookie: staff.cookie }));
    expect(list.data.map((r: { id: string }) => r.id)).toEqual([rate.id]);
    expect(list.meta.total).toBe(1);
  });

  test("only staff can read or record rates", async () => {
    const { cookie } = await signInCustomer();
    expect((await request("/api/v1/admin/fx-rates")).status).toBe(401);
    expect((await request("/api/v1/admin/fx-rates", { cookie })).status).toBe(403);
    expect((await record(cookie)).status).toBe(403);
  });

  test("invalid rates are rejected: same currency, zero, bad format, missing source, duplicates", async () => {
    const staff = await signInAdmin();
    expect((await record(staff.cookie, { quoteCurrency: "USD" })).status).toBe(422);
    expect((await record(staff.cookie, { rate: "0" })).status).toBe(422);
    expect((await record(staff.cookie, { rate: "abc" })).status).toBe(422);
    expect((await record(staff.cookie, { source: "" })).status).toBe(422);
    expect((await record(staff.cookie, { extra: true })).status).toBe(422);
    expect((await record(staff.cookie)).status).toBe(200);
    const duplicate = await record(staff.cookie);
    expect(duplicate.status).toBe(422);
    expect((await json(duplicate)).error.code).toBe("VALIDATION_ERROR");
  });

  test("rates cannot be edited or deleted", async () => {
    const staff = await signInAdmin();
    const rate = (await json(await record(staff.cookie))).data;
    expect((await patchJson(`/api/v1/admin/fx-rates/${rate.id}`, { rate: "1" }, { cookie: staff.cookie })).status).toBe(404);
    expect((await request(`/api/v1/admin/fx-rates/${rate.id}`, { cookie: staff.cookie, method: "DELETE" })).status).toBe(404);
  });
});

describe("the current rate", () => {
  test("is 404 until one is on file, then the latest one already in effect, with source and date", async () => {
    const staff = await signInAdmin();
    expect((await request("/api/v1/fx-rates/current?base=USD&quote=KHR")).status).toBe(404);

    await record(staff.cookie, { rate: "4000", source: "Older", effectiveAt: "2026-01-01T00:00:00Z" });
    await record(staff.cookie, { rate: "4100", source: "Newer", effectiveAt: "2026-02-01T00:00:00Z" });
    await record(staff.cookie, { rate: "9000", source: "Future", effectiveAt: "2099-01-01T00:00:00Z" });

    const current = (await json(await request("/api/v1/fx-rates/current?base=USD&quote=KHR"))).data;
    expect(current).toMatchObject({ rate: "4100.00000000", source: "Newer", effectiveAt: "2026-02-01T00:00:00.000Z" });
    expect((await request("/api/v1/fx-rates/current?base=KHR&quote=USD")).status).toBe(404);
    expect((await request("/api/v1/fx-rates/current?base=USD&quote=EUR")).status).toBe(422);
  });
});

describe("KHR loans", () => {
  test("are refused until an exchange rate is on file", async () => {
    const { cookie } = await signInCustomer();
    const response = await postJson("/api/v1/loans", draftBody({ currency: "KHR", requestedAmountMinor: 500_000_000 }), { cookie });
    expect(response.status).toBe(422);
    expect((await json(response)).error.code).toBe("VALIDATION_ERROR");
  });

  test("use limits derived from the rate in effect, and the limits move with a newer rate", async () => {
    const staff = await signInAdmin();
    const { cookie } = await signInCustomer();
    await record(staff.cookie, { rate: "4000", effectiveAt: "2026-01-01T00:00:00Z" });

    expect((await postJson("/api/v1/loans", draftBody({ currency: "KHR", requestedAmountMinor: 400_000_000 }), { cookie })).status).toBe(201);
    expect((await postJson("/api/v1/loans", draftBody({ currency: "KHR", requestedAmountMinor: 399_999_999 }), { cookie })).status).toBe(422);
    expect((await postJson("/api/v1/loans", draftBody({ currency: "KHR", requestedAmountMinor: 10_000_000_001 }), { cookie })).status).toBe(422);

    await record(staff.cookie, { rate: "5000", effectiveAt: "2026-03-01T00:00:00Z" });
    expect((await postJson("/api/v1/loans", draftBody({ currency: "KHR", requestedAmountMinor: 450_000_000 }), { cookie })).status).toBe(422);
    expect((await postJson("/api/v1/loans", draftBody({ currency: "KHR", requestedAmountMinor: 500_000_000 }), { cookie })).status).toBe(201);
  });

  test("a USD loan is validated on its native limits whatever rates exist, and its amounts are never converted", async () => {
    const staff = await signInAdmin();
    const { cookie } = await signInCustomer();
    await record(staff.cookie, { rate: "1", effectiveAt: "2026-01-01T00:00:00Z" });
    const created = await createDraft(cookie, { requestedAmountMinor: 100_000 });
    expect(created).toBeTruthy();
    const body = await json(await request(`/api/v1/loans/${created.reference}`, { cookie }));
    expect(body.data).toMatchObject({ currency: "USD", requestedAmountMinor: 100_000 });
    expect((await postJson("/api/v1/loans", draftBody({ requestedAmountMinor: 99_999 }), { cookie })).status).toBe(422);
  });
});
