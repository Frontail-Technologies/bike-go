import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { UnwrapSchema } from "elysia";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { account, bookings, customerProfiles, loanApplications, user, vehicles } from "@/libs/db/schema";
import { paginate } from "@/libs/pagination";
import type { CustomerGet } from "./model";
import type { CustomersGet } from "./types";
import { publicEmail } from "@/libs/identity";
import type { CustomerRow } from "./types";

async function summarise(rows: CustomerRow[]) {
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];
  const [providers, bookingCounts, loanCounts] = await Promise.all([
    db.select({ userId: account.userId, providerId: account.providerId }).from(account).where(inArray(account.userId, ids)),
    db.select({ userId: bookings.userId, n: count() }).from(bookings).where(inArray(bookings.userId, ids)).groupBy(bookings.userId),
    db.select({ userId: loanApplications.userId, n: count() }).from(loanApplications).where(inArray(loanApplications.userId, ids)).groupBy(loanApplications.userId),
  ]);
  return rows.map((r) => {
    const email = publicEmail(r.profileEmail, r.email);
    return {
      id: r.id,
      role: r.role,
      name: r.profileName ?? r.name,
      email,
      phone: r.phone,
      city: r.city,
      providers: [...new Set(providers.filter((p) => p.userId === r.id).map((p) => p.providerId))],
      bookingCount: bookingCounts.find((b) => b.userId === r.id)?.n ?? 0,
      loanCount: loanCounts.find((l) => l.userId === r.id)?.n ?? 0,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

const selectCustomers = () =>
  db
    .select({ id: user.id, role: user.role, name: user.name, email: user.email, profileName: customerProfiles.fullName, profileEmail: customerProfiles.email, phone: customerProfiles.phone, city: customerProfiles.city, createdAt: user.createdAt })
    .from(user)
    .leftJoin(customerProfiles, eq(customerProfiles.userId, user.id));

export async function adminListCustomers(query: CustomersGet["Query"]) {
  const search = query.q ? `%${query.q}%` : undefined;
  const where = and(eq(user.role, "customer"), search ? or(ilike(user.name, search), ilike(user.email, search), ilike(customerProfiles.fullName, search), ilike(customerProfiles.phone, search)) : undefined);
  const order = { newest: desc(user.createdAt), oldest: asc(user.createdAt), name: asc(user.name) }[query.sort ?? "newest"];

  return paginate(query, {
    rows: (page) => selectCustomers().where(where).orderBy(order, asc(user.id)).limit(page.limit).offset(page.offset),
    total: () => db.select({ n: count() }).from(user).leftJoin(customerProfiles, eq(customerProfiles.userId, user.id)).where(where),
    map: summarise,
  });
}

export async function adminGetCustomer(id: string): Promise<UnwrapSchema<typeof CustomerGet.Response>["data"]> {
  const [row] = await selectCustomers().where(eq(user.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Customer not found.");
  const [summary] = await summarise([row]);

  const [profile, recentBookings, recentLoans] = await Promise.all([
    db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).limit(1),
    db
      .select({ reference: bookings.reference, bookingStatus: bookings.bookingStatus, vehicleName: vehicles.name, pickupAt: bookings.pickupAt, totalPayableMinor: bookings.totalPayableMinor, currency: bookings.currency })
      .from(bookings)
      .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
      .where(eq(bookings.userId, id))
      .orderBy(desc(bookings.createdAt))
      .limit(5),
    db
      .select({ reference: loanApplications.reference, status: loanApplications.status, loanType: loanApplications.loanType, requestedAmountMinor: loanApplications.requestedAmountMinor, currency: loanApplications.currency, createdAt: loanApplications.createdAt })
      .from(loanApplications)
      .where(eq(loanApplications.userId, id))
      .orderBy(desc(loanApplications.createdAt))
      .limit(5),
  ]);

  const p = profile[0];
  return {
    ...summary!,
    profile: { fullName: p?.fullName ?? null, dateOfBirth: p?.dateOfBirth ?? null, nationality: p?.nationality ?? null, address: p?.address ?? null, telegramUsername: p?.telegramUsername ?? null },
    recentBookings: recentBookings.map((b) => ({ ...b, pickupAt: b.pickupAt.toISOString() })),
    recentLoans: recentLoans.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
  };
}
