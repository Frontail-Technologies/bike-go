import { and, asc, count, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Executor } from "@/libs/db";
import { customerProfiles, loanApplications, loanStatusHistory, user } from "@/libs/db/schema";
import { pageMeta, pageOf } from "@/libs/pagination";
import { loanView, recordTransition } from "@/routes/loan/service";
import { assertTransition, STAFF_TRANSITIONS, type LoanStatus } from "@/routes/loan/rules";
import type { AdminLoanView, LoansGet } from "./model";

/** Staff see the customer's identity and who made each status change. */
export async function adminLoanView(executor: Executor, id: string): Promise<AdminLoanView> {
  const base = await loanView(executor, id);
  const [row] = await executor
    .select({ userId: loanApplications.userId, name: user.name, email: user.email, profileName: customerProfiles.fullName, profileEmail: customerProfiles.email, phone: customerProfiles.phone, mobile: loanApplications.mobile })
    .from(loanApplications)
    .innerJoin(user, eq(user.id, loanApplications.userId))
    .leftJoin(customerProfiles, eq(customerProfiles.userId, loanApplications.userId))
    .where(eq(loanApplications.id, id))
    .limit(1);
  const history = await executor
    .select({ oldStatus: loanStatusHistory.oldStatus, newStatus: loanStatusHistory.newStatus, note: loanStatusHistory.note, changedBy: loanStatusHistory.changedBy, changedByName: user.name, createdAt: loanStatusHistory.createdAt })
    .from(loanStatusHistory)
    .leftJoin(user, eq(user.id, loanStatusHistory.changedBy))
    .where(eq(loanStatusHistory.applicationId, id))
    .orderBy(asc(loanStatusHistory.createdAt), asc(loanStatusHistory.id));

  const email = (row!.profileEmail ?? row!.email).endsWith("@users.ridego.invalid") ? null : (row!.profileEmail ?? row!.email);
  return {
    ...base,
    userId: row!.userId,
    customer: { name: row!.profileName ?? row!.name, email, phone: row!.phone ?? row!.mobile },
    history: history.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })),
    allowedNextStatuses: [...STAFF_TRANSITIONS[base.status]],
  };
}

async function idOf(reference: string) {
  const [row] = await db.select({ id: loanApplications.id }).from(loanApplications).where(eq(loanApplications.reference, reference)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Application not found.");
  return row.id;
}

export async function adminGetLoan(reference: string) {
  return adminLoanView(db, await idOf(reference));
}

export async function adminListLoans(query: LoansGet["Query"]) {
  const paging = pageOf(query);
  const search = query.q ? `%${query.q}%` : undefined;
  const where = and(
    query.status ? eq(loanApplications.status, query.status) : undefined,
    query.loanType ? eq(loanApplications.loanType, query.loanType) : undefined,
    query.from ? gte(loanApplications.createdAt, new Date(query.from)) : undefined,
    query.to ? lt(loanApplications.createdAt, new Date(query.to)) : undefined,
    search ? or(ilike(loanApplications.reference, search), ilike(loanApplications.fullName, search), ilike(loanApplications.email, search), ilike(loanApplications.mobile, search)) : undefined,
  ) as SQL | undefined;
  const order = {
    newest: desc(loanApplications.createdAt),
    oldest: asc(loanApplications.createdAt),
    amount_desc: desc(loanApplications.requestedAmountMinor),
    amount_asc: asc(loanApplications.requestedAmountMinor),
  }[query.sort ?? "newest"];

  const [rows, [total]] = await Promise.all([
    db.select({ id: loanApplications.id }).from(loanApplications).where(where).orderBy(order, asc(loanApplications.reference)).limit(paging.limit).offset(paging.offset),
    db.select({ n: count() }).from(loanApplications).where(where),
  ]);
  return { data: await Promise.all(rows.map((r) => adminLoanView(db, r.id))), meta: pageMeta(paging, total?.n ?? 0) };
}

/**
 * Staff move an application along the explicit transition map. Approval and rejection are decisions made here,
 * by a person, and nowhere else. Every move is written to the status history with who made it and why.
 */
export async function changeLoanStatus(reference: string, staffUserId: string, to: LoanStatus, note: string | undefined) {
  return db.transaction(async (tx) => {
    // Lock first, so two staff members acting on one application are applied one after the other.
    await tx.execute(sql`select id from ${loanApplications} where ${loanApplications.reference} = ${reference} for update`);
    const [current] = await tx.select().from(loanApplications).where(eq(loanApplications.reference, reference)).limit(1);
    if (!current) throw new AppError("NOT_FOUND", 404, "Application not found.");
    assertTransition(current.status, to, "staff", note);
    await recordTransition(tx, current, to, staffUserId, note);
    return adminLoanView(tx, current.id);
  });
}
