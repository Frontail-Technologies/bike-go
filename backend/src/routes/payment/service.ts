import { and, desc, eq } from "drizzle-orm";
import { AppError, notFound } from "@/libs/api";
import { db } from "@/libs/db";
import { PG, pgErrorCode } from "@/libs/db/errors";
import { lockRows } from "@/libs/db/lock";
import { bookings, payments as paymentsTable, vehicles } from "@/libs/db/schema";
import { payments } from "@/providers/payment";
import { expireStaleHolds } from "../booking/holds";
import type { PaymentProvider, TransactionCheck } from "@/providers/payment/types";
import type { PaymentReview, PaymentRow } from "./types";

const newTransactionId = () => `T${crypto.randomUUID().replaceAll("-", "").slice(0, 19).toUpperCase()}`;

function provider(): PaymentProvider {
  if (!payments) throw new AppError("PAYMENT_UNAVAILABLE", 503, "Online payment is not available right now.");
  return payments;
}

export async function startPayment(userId: string, reference: string) {
  const gateway = provider();
  return db.transaction(async (tx) => {
    await expireStaleHolds(tx, { userId, reference });
    const owned = and(eq(bookings.reference, reference), eq(bookings.userId, userId));
    const [found] = await tx.select({ id: bookings.id }).from(bookings).where(owned).limit(1);
    if (!found) throw notFound("Booking");
    await lockRows(tx, bookings, eq(bookings.id, found.id));
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, found.id)).limit(1);
    if (!booking) throw notFound("Booking");

    if (booking.paymentStatus === "paid") throw new AppError("INVALID_BOOKING_STATUS", 409, "This booking is already paid.");
    if (booking.bookingStatus !== "pending") {
      throw new AppError("INVALID_BOOKING_STATUS", 409, `A booking that is ${booking.bookingStatus.replaceAll("_", " ")} cannot be paid.`);
    }

    const [open] = await tx.select().from(paymentsTable).where(and(eq(paymentsTable.bookingId, booking.id), eq(paymentsTable.status, "pending"))).limit(1);
    const attempt =
      open ??
      (
        await tx
          .insert(paymentsTable)
          .values({ bookingId: booking.id, provider: gateway.name, transactionId: newTransactionId(), amountMinor: booking.totalPayableMinor, currency: booking.currency })
          .returning()
      )[0]!;

    await tx.update(bookings).set({ paymentStatus: "pending" }).where(eq(bookings.id, booking.id));

    return {
      transactionId: attempt.transactionId,
      amountMinor: attempt.amountMinor,
      currency: attempt.currency,
      expiresAt: booking.holdExpiresAt?.toISOString() ?? null,
      checkout: gateway.createCheckout({ transactionId: attempt.transactionId, amountMinor: attempt.amountMinor, currency: attempt.currency, bookingReference: booking.reference }),
    };
  });
}

function judge(attempt: PaymentRow, check: Extract<TransactionCheck, { state: "approved" | "failed" }>) {
  if (check.state === "failed") return { outcome: "failed" as const, review: null };
  if (check.amountMinor !== attempt.amountMinor || check.currency !== attempt.currency) return { outcome: "failed" as const, review: "amount_mismatch" as const };
  return { outcome: "paid" as const, review: null };
}

export async function settlePayment(transactionId: string): Promise<PaymentRow | null> {
  const [attempt] = await db.select().from(paymentsTable).where(eq(paymentsTable.transactionId, transactionId)).limit(1);
  if (!attempt) return null;
  if (attempt.status !== "pending") return attempt;

  const check = await provider().checkTransaction(transactionId);
  if (check.state === "pending") return attempt;
  const verdict = judge(attempt, check);

  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, attempt.bookingId)).limit(1);
    await lockRows(tx, vehicles, eq(vehicles.id, booking!.vehicleId));
    await lockRows(tx, paymentsTable, eq(paymentsTable.id, attempt.id));
    await lockRows(tx, bookings, eq(bookings.id, attempt.bookingId));

    const [current] = await tx.select().from(paymentsTable).where(eq(paymentsTable.id, attempt.id)).limit(1);
    if (!current || current.status !== "pending") return current ?? attempt;
    const [locked] = await tx.select().from(bookings).where(eq(bookings.id, attempt.bookingId)).limit(1);

    let review: PaymentReview | null = verdict.review;
    let bookingPatch: Partial<typeof bookings.$inferInsert>;

    if (verdict.outcome === "failed") {
      bookingPatch = locked!.paymentStatus === "paid" ? {} : { paymentStatus: "failed" };
    } else if (locked!.bookingStatus === "cancelled") {
      review = "booking_cancelled";
      bookingPatch = { paymentStatus: "paid" };
    } else if (locked!.bookingStatus === "pending" || locked!.bookingStatus === "expired") {
      bookingPatch = { bookingStatus: "confirmed", paymentStatus: "paid", holdExpiresAt: null };
    } else {
      bookingPatch = { paymentStatus: "paid" };
    }

    if (Object.keys(bookingPatch).length > 0) {
      try {
        await tx.transaction((savepoint) => savepoint.update(bookings).set(bookingPatch).where(eq(bookings.id, attempt.bookingId)));
      } catch (error) {
        if (pgErrorCode(error) !== PG.exclusionViolation) throw error;
        review = "paid_after_hold_expired";
        await tx.update(bookings).set({ paymentStatus: "paid" }).where(eq(bookings.id, attempt.bookingId));
      }
    }

    const [settled] = await tx
      .update(paymentsTable)
      .set({ status: verdict.outcome, review, providerResponse: check.raw, paidAt: verdict.outcome === "paid" ? new Date() : null })
      .where(eq(paymentsTable.id, attempt.id))
      .returning();
    return settled!;
  });
}

export async function getBookingPayment(userId: string, reference: string) {
  await expireStaleHolds(db, { userId, reference });
  const owned = and(eq(bookings.reference, reference), eq(bookings.userId, userId));
  const [found] = await db.select({ id: bookings.id }).from(bookings).where(owned).limit(1);
  if (!found) throw notFound("Booking");

  const [open] = await db.select().from(paymentsTable).where(and(eq(paymentsTable.bookingId, found.id), eq(paymentsTable.status, "pending"))).limit(1);
  if (open) {
    try {
      await settlePayment(open.transactionId);
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "PAYMENT_PROVIDER_ERROR") throw error;
    }
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, found.id)).limit(1);
  const [latest] = await db.select().from(paymentsTable).where(eq(paymentsTable.bookingId, found.id)).orderBy(desc(paymentsTable.createdAt)).limit(1);
  return {
    bookingStatus: booking!.bookingStatus,
    paymentStatus: booking!.paymentStatus,
    attempt: latest ? { transactionId: latest.transactionId, status: latest.status, paidAt: latest.paidAt?.toISOString() ?? null } : null,
  };
}
