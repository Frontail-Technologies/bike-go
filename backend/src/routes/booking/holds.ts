import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/libs/db";
import { bookings } from "@/libs/db/schema";
import type { Executor } from "@/libs/db/types";
import type { BookingStatus, HoldScope } from "./types";

export const effectiveBookingStatus = sql<BookingStatus>`CASE WHEN ${bookings.bookingStatus} = 'pending' AND ${bookings.holdExpiresAt} <= now() THEN 'expired' ELSE ${bookings.bookingStatus}::text END`;

export function withLapsedHold<T extends BookingStatus>(row: { bookingStatus: T; holdExpiresAt: Date | null }, now: Date = new Date()): T | "expired" {
  return row.bookingStatus === "pending" && row.holdExpiresAt && row.holdExpiresAt <= now ? "expired" : row.bookingStatus;
}

export async function expireStaleHolds(executor: Executor, scope: HoldScope = {}, now: Date = new Date()) {
  const expired = await executor
    .update(bookings)
    .set({ bookingStatus: "expired" })
    .where(
      and(
        eq(bookings.bookingStatus, "pending"),
        lte(bookings.holdExpiresAt, now),
        scope.vehicleId ? eq(bookings.vehicleId, scope.vehicleId) : undefined,
        scope.userId ? eq(bookings.userId, scope.userId) : undefined,
        scope.reference ? eq(bookings.reference, scope.reference) : undefined,
      ),
    )
    .returning({ id: bookings.id });
  return expired.length;
}

export function startHoldSweeper(intervalMs = 60_000) {
  const timer = setInterval(() => {
    expireStaleHolds(db).catch((error) => console.error("hold sweep failed", error));
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
