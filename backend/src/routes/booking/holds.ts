import { and, eq, lte } from "drizzle-orm";
import { db, type Executor } from "@/libs/db";
import { bookings } from "@/libs/db/schema";

type Scope = { vehicleId?: string; userId?: string; reference?: string };

export async function expireStaleHolds(executor: Executor, scope: Scope = {}, now: Date = new Date()) {
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
