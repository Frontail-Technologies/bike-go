import { beforeAll, describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { bookings, payments } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { formatAmount } from "../src/providers/payment/payway";
import { fakePayway } from "./helpers/fake-payway";
import { json } from "./helpers/http";
import { postJson, request, signInCustomer } from "./helpers/auth";
import { bookVehicle, rentalWindow } from "./helpers/booking";

beforeAll(async () => {
  await seedCatalog();
});

const FIELD_ORDER = [
  "req_time", "merchant_id", "tran_id", "amount", "items", "shipping", "ctid", "pwt", "firstname", "lastname", "email", "phone", "type", "payment_option",
  "return_url", "cancel_url", "continue_success_url", "return_deeplink", "currency", "custom_fields", "return_params", "payout", "lifetime", "additional_params", "google_pay_token",
];

const money = (minor: number) => (minor / 100).toFixed(2);

async function pendingBooking(vehicle = "honda-activa") {
  const session = await signInCustomer();
  const created = (await json(await bookVehicle(session.cookie, vehicle, rentalWindow()))).data;
  return { ...session, reference: created.reference as string, totalMinor: created.pricing.totalPayableMinor as number, currency: created.currency as "USD" | "KHR" };
}

const startPayment = (cookie: string, reference: string) => postJson(`/api/v1/bookings/${reference}/payments`, {}, { cookie });
const callback = (body: unknown) => postJson("/api/v1/payments/payway/callback", body);
const paymentOf = (cookie: string, reference: string) => request(`/api/v1/bookings/${reference}/payment`, { cookie });
const bookingRow = async (reference: string) => (await db.select().from(bookings).where(eq(bookings.reference, reference)))[0]!;
const attemptRow = async (transactionId: string) => (await db.select().from(payments).where(eq(payments.transactionId, transactionId)))[0]!;

async function started(booking: Awaited<ReturnType<typeof pendingBooking>>) {
  const response = await startPayment(booking.cookie, booking.reference);
  expect(response.status).toBe(200);
  return (await json(response)).data as { transactionId: string; amountMinor: number; currency: string; expiresAt: string | null; checkout: { action: string; method: string; fields: Record<string, string> } };
}

const approve = (transactionId: string, booking: { totalMinor: number; currency: "USD" | "KHR" }, overrides: Partial<{ status: "APPROVED" | "PENDING" | "DECLINED"; amount: string; currency: "USD" | "KHR" }> = {}) =>
  fakePayway().transactions.set(transactionId, { status: "APPROVED", amount: money(booking.totalMinor), currency: booking.currency, ...overrides });

describe("starting a payment", () => {
  test("returns a PayWay form signed with the API key, for the stored booking total in KHQR", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);

    expect(payment.checkout.method).toBe("POST");
    expect(payment.checkout.action).toBe(`${fakePayway().url}/purchase`);
    const { fields } = payment.checkout;
    expect(fields.merchant_id).toBe("test-merchant");
    expect(fields.tran_id).toBe(payment.transactionId);
    expect(fields.tran_id!.length).toBeLessThanOrEqual(20);
    expect(fields.amount).toBe(money(booking.totalMinor));
    expect(fields.currency).toBe(booking.currency);
    expect(fields.payment_option).toBe("abapay_khqr");
    expect(fields.type).toBe("purchase");
    expect(Buffer.from(fields.return_url!, "base64").toString()).toBe("http://localhost:3001/api/v1/payments/payway/callback");
    expect(fields.continue_success_url).toBe(`http://localhost:3000/bookings/${booking.reference}/confirmation`);
    expect(fields.cancel_url).toBe(`http://localhost:3000/bookings/${booking.reference}`);

    const expected = createHmac("sha512", fakePayway().apiKey).update(FIELD_ORDER.map((name) => fields[name]).join("")).digest("base64");
    expect(fields.hash).toBe(expected);
    expect(JSON.stringify(payment)).not.toContain(fakePayway().apiKey);

    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "pending", paymentStatus: "pending" });
  });

  test("calling again while an attempt is open returns the same transaction", async () => {
    const booking = await pendingBooking();
    const first = await started(booking);
    const second = await started(booking);
    expect(second.transactionId).toBe(first.transactionId);
    expect(await db.select().from(payments).where(eq(payments.bookingId, (await bookingRow(booking.reference)).id))).toHaveLength(1);
  });

  test("only the owner can pay, and the customer must be signed in", async () => {
    const booking = await pendingBooking();
    const stranger = await signInCustomer();
    expect((await startPayment(stranger.cookie, booking.reference)).status).toBe(404);
    expect((await postJson(`/api/v1/bookings/${booking.reference}/payments`, {})).status).toBe(401);
    expect((await paymentOf(stranger.cookie, booking.reference)).status).toBe(404);
  });

  test("a booking that is not pending, or is already paid, cannot be paid", async () => {
    const booking = await pendingBooking();
    await postJson(`/api/v1/bookings/${booking.reference}/cancel`, {}, { cookie: booking.cookie });
    const cancelled = await startPayment(booking.cookie, booking.reference);
    expect(cancelled.status).toBe(409);
    expect((await json(cancelled)).error.code).toBe("INVALID_BOOKING_STATUS");

    const paid = await pendingBooking();
    const payment = await started(paid);
    approve(payment.transactionId, paid);
    await callback({ tran_id: payment.transactionId });
    const again = await startPayment(paid.cookie, paid.reference);
    expect(again.status).toBe(409);
  });
});

describe("confirming a payment", () => {
  test("an approved transaction confirms the booking once, and a repeated callback changes nothing", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);
    approve(payment.transactionId, booking);

    const first = await callback({ tran_id: payment.transactionId, status: 0, apv: "123456" });
    expect(first.status).toBe(200);
    expect((await json(first)).data).toEqual({ received: true, status: "paid" });
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "confirmed", paymentStatus: "paid", holdExpiresAt: null });
    const settled = await attemptRow(payment.transactionId);
    expect(settled).toMatchObject({ status: "paid", review: null });
    expect(settled.paidAt).toBeTruthy();
    expect(settled.providerResponse).toBeTruthy();

    const checksBefore = fakePayway().checks.length;
    const replay = await callback({ tran_id: payment.transactionId });
    expect((await json(replay)).data.status).toBe("paid");
    expect(fakePayway().checks.length).toBe(checksBefore);
    expect(fakePayway().checks.every((c) => c.signed)).toBe(true);
  });

  test("the callback body is never trusted: a claimed success for an unpaid transaction does nothing", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);
    fakePayway().transactions.set(payment.transactionId, { status: "PENDING", amount: money(booking.totalMinor), currency: booking.currency });

    const response = await callback({ tran_id: payment.transactionId, status: 0, apv: "999999" });
    expect((await json(response)).data.status).toBe("pending");
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "pending", paymentStatus: "pending" });

    const unknownToPayway = await pendingBooking();
    const attempt = await started(unknownToPayway);
    await callback({ tran_id: attempt.transactionId, status: 0 });
    expect((await attemptRow(attempt.transactionId)).status).toBe("pending");
  });

  test("form-encoded and base64 response callbacks are understood", async () => {
    const formBooking = await pendingBooking();
    const formPayment = await started(formBooking);
    approve(formPayment.transactionId, formBooking);
    const form = await request("/api/v1/payments/payway/callback", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tran_id: formPayment.transactionId, status: "0" }).toString(),
    });
    expect((await json(form)).data.status).toBe("paid");

    const wrapped = await pendingBooking();
    const wrappedPayment = await started(wrapped);
    approve(wrappedPayment.transactionId, wrapped);
    const response = Buffer.from(JSON.stringify({ tran_id: wrappedPayment.transactionId, status: 0 })).toString("base64");
    const encoded = await request("/api/v1/payments/payway/callback", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ response }).toString(),
    });
    expect((await json(encoded)).data.status).toBe("paid");
  });

  test("an unknown transaction is a 404 and PayWay is not contacted", async () => {
    const before = fakePayway().checks.length;
    const response = await callback({ tran_id: "TNOSUCHTRANSACTION01" });
    expect(response.status).toBe(404);
    expect(fakePayway().checks.length).toBe(before);
    expect((await callback({})).status).toBe(422);
    expect((await callback({ response: "!!!not-base64-json" })).status).toBe(422);
  });

  test("polling the payment settles it when the callback never arrives", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);
    const waiting = (await json(await paymentOf(booking.cookie, booking.reference))).data;
    expect(waiting).toMatchObject({ bookingStatus: "pending", paymentStatus: "pending", attempt: { transactionId: payment.transactionId, status: "pending" } });

    approve(payment.transactionId, booking);
    const done = (await json(await paymentOf(booking.cookie, booking.reference))).data;
    expect(done).toMatchObject({ bookingStatus: "confirmed", paymentStatus: "paid", attempt: { status: "paid" } });
    expect(done.attempt.paidAt).toBeTruthy();
  });

  test("a declined payment fails the attempt, keeps the hold, and a retry gets a new transaction", async () => {
    const booking = await pendingBooking();
    const first = await started(booking);
    approve(first.transactionId, booking, { status: "DECLINED" });
    expect((await json(await callback({ tran_id: first.transactionId }))).data.status).toBe("failed");
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "pending", paymentStatus: "failed" });

    const second = await started(booking);
    expect(second.transactionId).not.toBe(first.transactionId);
    approve(second.transactionId, booking);
    await callback({ tran_id: second.transactionId });
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "confirmed", paymentStatus: "paid" });
  });

  test("an approved transaction for a different amount or currency is not accepted and is flagged", async () => {
    const wrongAmount = await pendingBooking();
    const a = await started(wrongAmount);
    approve(a.transactionId, wrongAmount, { amount: money(wrongAmount.totalMinor - 100) });
    await callback({ tran_id: a.transactionId });
    expect(await attemptRow(a.transactionId)).toMatchObject({ status: "failed", review: "amount_mismatch" });
    expect(await bookingRow(wrongAmount.reference)).toMatchObject({ bookingStatus: "pending", paymentStatus: "failed" });

    const wrongCurrency = await pendingBooking();
    const b = await started(wrongCurrency);
    approve(b.transactionId, wrongCurrency, { currency: wrongCurrency.currency === "USD" ? "KHR" : "USD" });
    await callback({ tran_id: b.transactionId });
    expect(await attemptRow(b.transactionId)).toMatchObject({ status: "failed", review: "amount_mismatch" });
  });

  test("concurrent callbacks confirm the booking exactly once", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);
    approve(payment.transactionId, booking);

    const responses = await Promise.all(Array.from({ length: 8 }, () => callback({ tran_id: payment.transactionId })));
    expect(responses.map((r) => r.status)).toEqual(Array(8).fill(200));
    expect(await Promise.all(responses.map(async (r) => (await json(r)).data.status))).toEqual(Array(8).fill("paid"));
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "confirmed", paymentStatus: "paid" });
    expect(await db.select().from(payments).where(eq(payments.bookingId, (await bookingRow(booking.reference)).id))).toHaveLength(1);
  });
});

describe("late and awkward payments", () => {
  const lapse = (reference: string) => db.update(bookings).set({ holdExpiresAt: new Date(Date.now() - 60_000) }).where(eq(bookings.reference, reference));

  test("paying after the hold lapsed still confirms the booking when nobody else took the vehicle", async () => {
    const booking = await pendingBooking("royal-enfield-classic-350");
    const payment = await started(booking);
    await lapse(booking.reference);
    approve(payment.transactionId, booking);

    await callback({ tran_id: payment.transactionId });
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "confirmed", paymentStatus: "paid" });
    expect((await attemptRow(payment.transactionId)).review).toBeNull();
  });

  test("paying after someone else took the vehicle keeps the money visible and flags it for a refund", async () => {
    const owner = await signInCustomer();
    const rival = await signInCustomer();
    const window = rentalWindow();
    const created = (await json(await bookVehicle(owner.cookie, "yamaha-mt-15", window))).data;
    const booking = { ...owner, reference: created.reference as string, totalMinor: created.pricing.totalPayableMinor as number, currency: created.currency as "USD" | "KHR" };
    const payment = await started(booking);
    await lapse(booking.reference);

    expect((await bookVehicle(rival.cookie, "yamaha-mt-15", window)).status).toBe(201);
    expect((await bookingRow(booking.reference)).bookingStatus).toBe("expired");

    approve(payment.transactionId, booking);
    const response = await callback({ tran_id: payment.transactionId });
    expect(response.status).toBe(200);
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "expired", paymentStatus: "paid" });
    expect(await attemptRow(payment.transactionId)).toMatchObject({ status: "paid", review: "paid_after_hold_expired" });
  });

  test("paying a booking that was cancelled meanwhile is flagged for a refund and does not revive it", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);
    await postJson(`/api/v1/bookings/${booking.reference}/cancel`, {}, { cookie: booking.cookie });
    approve(payment.transactionId, booking);

    await callback({ tran_id: payment.transactionId });
    expect(await bookingRow(booking.reference)).toMatchObject({ bookingStatus: "cancelled", paymentStatus: "paid" });
    expect(await attemptRow(payment.transactionId)).toMatchObject({ status: "paid", review: "booking_cancelled" });
  });

  test("when PayWay is unreachable the callback asks to be retried and nothing changes", async () => {
    const booking = await pendingBooking();
    const payment = await started(booking);
    approve(payment.transactionId, booking);

    fakePayway().failNext.value = true;
    const down = await callback({ tran_id: payment.transactionId });
    expect(down.status).toBe(502);
    expect((await json(down)).error.code).toBe("PAYMENT_PROVIDER_ERROR");
    expect((await attemptRow(payment.transactionId)).status).toBe("pending");

    fakePayway().failNext.value = true;
    const polled = await paymentOf(booking.cookie, booking.reference);
    expect(polled.status).toBe(200);
    expect((await json(polled)).data.attempt.status).toBe("pending");

    expect((await json(await callback({ tran_id: payment.transactionId }))).data.status).toBe("paid");
  });
});

describe("amounts and configuration", () => {
  test("amounts are formatted for PayWay without floating point", () => {
    expect(formatAmount(1250, "USD")).toBe("12.50");
    expect(formatAmount(5, "USD")).toBe("0.05");
    expect(formatAmount(4_100_000, "KHR")).toBe("41000");
    expect(() => formatAmount(4_100_050, "KHR")).toThrow();
  });

  const run = async (env: Record<string, string>) => {
    const child = Bun.spawn(["bun", "-e", 'await import("./src/env"); console.log("ENV OK")'], {
      cwd: new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
      env: { PATH: process.env.PATH ?? "", ...env },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
    await child.exited;
    return out + err;
  };

  test("payway without credentials refuses to start", async () => {
    const output = await run({ PAYMENT_DRIVER: "payway" });
    expect(output).toContain("PAYMENT_DRIVER=payway needs");
    expect(output).toContain("PAYWAY_MERCHANT_ID");
    expect(output).toContain("PAYWAY_API_KEY");
    expect(await run({ PAYMENT_DRIVER: "payway", PAYWAY_MERCHANT_ID: "m", PAYWAY_API_KEY: "k" })).toContain("ENV OK");
  });

  test("production needs live PayWay settings, not the sandbox", async () => {
    const production = {
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "prod-verification-secret-0123456789abcdef-xyz",
      GOOGLE_CLIENT_ID: "g",
      GOOGLE_CLIENT_SECRET: "g",
      TELEGRAM_BOT_TOKEN: "1:t",
      STORAGE_DRIVER: "r2",
      R2_ACCOUNT_ID: "a",
      R2_BUCKET: "b",
      R2_ACCESS_KEY_ID: "k",
      R2_SECRET_ACCESS_KEY: "s",
    };
    expect(await run({ ...production, PAYMENT_DRIVER: "disabled" })).toContain("PAYMENT_DRIVER must be payway in production");
    expect(await run({ ...production, PAYMENT_DRIVER: "payway", PAYWAY_MERCHANT_ID: "m", PAYWAY_API_KEY: "k" })).toContain("sandbox URLs cannot be used in production");
    expect(
      await run({
        ...production,
        PAYMENT_DRIVER: "payway",
        PAYWAY_MERCHANT_ID: "m",
        PAYWAY_API_KEY: "k",
        PAYWAY_CHECKOUT_URL: "https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase",
        PAYWAY_CHECK_URL: "https://checkout.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2",
      }),
    ).toContain("ENV OK");
  });
});
