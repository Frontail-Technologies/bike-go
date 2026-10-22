import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/libs/db";
import { bookings, loanApplications, user, vehicles } from "@/libs/db/schema";
import { expireStaleHolds } from "@/routes/booking/holds";

const toCounts = (rows: { key: string; n: number }[]) => Object.fromEntries(rows.map((r) => [r.key, Number(r.n)]));
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboard() {
  await expireStaleHolds(db);
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const taxable = sql`${bookings.rentalSubtotalMinor} + ${bookings.addonsTotalMinor} + ${bookings.platformFeeMinor} + ${bookings.taxesMinor}`;

  const [vehicleStatus, bookingStatus, upcoming, revenue, loanStatus, customerTotal, customerNew, recentBookings, recentLoans] = await Promise.all([
    db.select({ key: vehicles.status, n: count() }).from(vehicles).groupBy(vehicles.status),
    db.select({ key: bookings.bookingStatus, n: count() }).from(bookings).groupBy(bookings.bookingStatus),
    db.select({ n: count() }).from(bookings).where(and(inArray(bookings.bookingStatus, ["confirmed", "ready_for_pickup"]), gte(bookings.pickupAt, now), lt(bookings.pickupAt, soon))),
    db
      .select({
        currency: bookings.currency,
        booked: sql<string>`coalesce(sum(${taxable}), 0)`,
        paid: sql<string>`coalesce(sum(${taxable}) filter (where ${bookings.paymentStatus} = 'paid'), 0)`,
      })
      .from(bookings)
      .where(inArray(bookings.bookingStatus, ["confirmed", "ready_for_pickup", "active", "completed"]))
      .groupBy(bookings.currency),
    db.select({ key: loanApplications.status, n: count() }).from(loanApplications).groupBy(loanApplications.status),
    db.select({ n: count() }).from(user).where(eq(user.role, "customer")),
    db.select({ n: count() }).from(user).where(and(eq(user.role, "customer"), gte(user.createdAt, thirtyDaysAgo))),
    db
      .select({ reference: bookings.reference, bookingStatus: bookings.bookingStatus, customerName: user.name, vehicleName: vehicles.name, pickupAt: bookings.pickupAt, totalPayableMinor: bookings.totalPayableMinor, currency: bookings.currency })
      .from(bookings)
      .innerJoin(user, eq(user.id, bookings.userId))
      .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
      .orderBy(desc(bookings.createdAt))
      .limit(5),
    db
      .select({ reference: loanApplications.reference, status: loanApplications.status, applicantName: loanApplications.fullName, loanType: loanApplications.loanType, requestedAmountMinor: loanApplications.requestedAmountMinor, currency: loanApplications.currency, createdAt: loanApplications.createdAt })
      .from(loanApplications)
      .orderBy(desc(loanApplications.createdAt))
      .limit(5),
  ]);

  const vehiclesByStatus = toCounts(vehicleStatus);
  const bookingsByStatus = toCounts(bookingStatus);
  const loansByStatus = toCounts(loanStatus);
  const sum = (counts: Record<string, number>) => Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    vehicles: { total: sum(vehiclesByStatus), byStatus: vehiclesByStatus },
    bookings: {
      total: sum(bookingsByStatus),
      byStatus: bookingsByStatus,
      activeNow: bookingsByStatus.active ?? 0,
      upcomingPickups7d: upcoming[0]?.n ?? 0,
      revenue: revenue.map((r) => ({ currency: r.currency, bookedMinor: Number(r.booked), paidMinor: Number(r.paid) })),
    },
    loans: {
      total: sum(loansByStatus),
      byStatus: loansByStatus,
      awaitingReview: (loansByStatus.submitted ?? 0) + (loansByStatus.documents_under_review ?? 0) + (loansByStatus.eligibility_review ?? 0),
    },
    customers: { total: customerTotal[0]?.n ?? 0, newLast30Days: customerNew[0]?.n ?? 0 },
    recentBookings: recentBookings.map((b) => ({ ...b, pickupAt: b.pickupAt.toISOString() })),
    recentLoans: recentLoans.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
  };
}
