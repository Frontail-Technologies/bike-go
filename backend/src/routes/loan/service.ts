import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { ageOn } from "@/libs/date";
import { db, rowsOf, type Executor, type Tx } from "@/libs/db";
import { loanApplications, loanDocuments, loanStatusHistory } from "@/libs/db/schema";
import { idempotently } from "@/libs/idempotency";
import { pageMeta, pageOf } from "@/libs/pagination";
import { currentRate } from "@/routes/fx/service";
import { newReference } from "@/libs/reference";
import type { Currency } from "@/libs/money";
import type { LoanPatch, LoanPost, LoansGet, LoanView } from "./model";
import { assertTransition, isEditableByCustomer, loanLimits, MAX_AGE, MIN_AGE, REQUIRED_DOCUMENTS, TENURES_MONTHS, type LoanStatus, type LoanTypeId } from "./rules";

type Application = typeof loanApplications.$inferSelect;

const invalid = (path: string, message: string) => new AppError("VALIDATION_ERROR", 422, message, [{ path, message }]);

function assertRealDate(value: string, path: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw invalid(path, "That is not a real date.");
}

async function assertValues(executor: Executor, values: Pick<Application, "loanType" | "currency" | "requestedAmountMinor" | "tenureMonths" | "dateOfBirth">) {
  const fx = values.currency === "USD" ? null : await currentRate(executor, "USD", values.currency as Currency);
  const limits = loanLimits(values.loanType as LoanTypeId, values.currency as Currency, fx);
  if (values.requestedAmountMinor < limits.minMinor || values.requestedAmountMinor > limits.maxMinor) {
    throw new AppError("VALIDATION_ERROR", 422, "The requested amount is outside the range for this loan.", [
      { path: "requestedAmountMinor", message: `Must be between ${limits.minMinor} and ${limits.maxMinor} minor units.` },
    ]);
  }
  if (!(TENURES_MONTHS as readonly number[]).includes(values.tenureMonths) || values.tenureMonths > limits.maxTenure) {
    throw invalid("tenureMonths", `Choose one of ${TENURES_MONTHS.filter((m) => m <= limits.maxTenure).join(", ")} months for this loan.`);
  }
  if (values.dateOfBirth) {
    assertRealDate(values.dateOfBirth, "dateOfBirth");
    const age = ageOn(values.dateOfBirth);
    if (age < MIN_AGE || age > MAX_AGE) throw invalid("dateOfBirth", `Applicants must be between ${MIN_AGE} and ${MAX_AGE} years old.`);
  }
}

const WRITABLE = [
  "loanType", "currency", "requestedAmountMinor", "tenureMonths", "purpose",
  "fullName", "mobile", "email", "dateOfBirth", "nationality", "currentCity", "residenceStatus",
  "employmentType", "employerName", "jobTitle", "monthlyIncomeMinor", "workExperienceMonths", "hasActiveBankAccount",
] as const;

function definedOnly<T extends object>(value: T) {
  const source = value as Record<string, unknown>;
  return Object.fromEntries(WRITABLE.filter((key) => source[key] !== undefined).map((key) => [key, source[key]])) as Partial<Pick<Application, (typeof WRITABLE)[number]>>;
}

export async function loanView(executor: Executor, id: string): Promise<LoanView> {
  const [app] = await executor.select().from(loanApplications).where(eq(loanApplications.id, id)).limit(1);
  if (!app) throw new AppError("NOT_FOUND", 404, "Application not found.");
  const [documents, history] = await Promise.all([
    executor
      .select({
        id: loanDocuments.id,
        type: loanDocuments.type,
        originalFilename: loanDocuments.originalFilename,
        mimeType: loanDocuments.mimeType,
        sizeBytes: loanDocuments.sizeBytes,
        verificationStatus: loanDocuments.verificationStatus,
        reviewNote: loanDocuments.reviewNote,
        uploadedAt: loanDocuments.uploadedAt,
      })
      .from(loanDocuments)
      .where(eq(loanDocuments.applicationId, id))
      .orderBy(asc(loanDocuments.uploadedAt)),
    executor.select().from(loanStatusHistory).where(eq(loanStatusHistory.applicationId, id)).orderBy(asc(loanStatusHistory.createdAt), asc(loanStatusHistory.id)),
  ]);

  return {
    reference: app.reference,
    status: app.status,
    loanType: app.loanType,
    currency: app.currency,
    requestedAmountMinor: app.requestedAmountMinor,
    tenureMonths: app.tenureMonths,
    purpose: app.purpose,
    applicant: {
      fullName: app.fullName,
      mobile: app.mobile,
      email: app.email,
      dateOfBirth: app.dateOfBirth,
      nationality: app.nationality,
      currentCity: app.currentCity,
      residenceStatus: app.residenceStatus,
    },
    employment: {
      employmentType: app.employmentType,
      employerName: app.employerName,
      jobTitle: app.jobTitle,
      monthlyIncomeMinor: app.monthlyIncomeMinor,
      workExperienceMonths: app.workExperienceMonths,
      hasActiveBankAccount: app.hasActiveBankAccount,
    },
    submittedAt: app.submittedAt?.toISOString() ?? null,
    editable: isEditableByCustomer(app.status),
    documents: documents.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() })),
    history: history.map((h) => ({
      oldStatus: h.oldStatus,
      newStatus: h.newStatus,
      note: h.note,
      by: h.changedBy === null ? ("system" as const) : h.changedBy === app.userId ? ("you" as const) : ("staff" as const),
      createdAt: h.createdAt.toISOString(),
    })),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export async function findOwned(executor: Executor, userId: string, reference: string, options: { lock?: boolean } = {}) {
  if (options.lock) {
    const locked = rowsOf<{ id: string }>(
      await executor.execute(sql`select id from ${loanApplications} where ${loanApplications.reference} = ${reference} and ${loanApplications.userId} = ${userId} for update`),
    );
    if (locked.length === 0) throw new AppError("NOT_FOUND", 404, "Application not found.");
  }
  const [row] = await executor.select().from(loanApplications).where(and(eq(loanApplications.reference, reference), eq(loanApplications.userId, userId))).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Application not found.");
  return row;
}

export async function listMyLoans(userId: string, query: LoansGet["Query"]) {
  const paging = pageOf(query);
  const where = and(eq(loanApplications.userId, userId), query.status ? eq(loanApplications.status, query.status) : undefined);
  const [rows, [total]] = await Promise.all([
    db.select({ id: loanApplications.id }).from(loanApplications).where(where).orderBy(desc(loanApplications.createdAt), asc(loanApplications.reference)).limit(paging.limit).offset(paging.offset),
    db.select({ n: count() }).from(loanApplications).where(where),
  ]);
  return { data: await Promise.all(rows.map((r) => loanView(db, r.id))), meta: pageMeta(paging, total?.n ?? 0) };
}

export async function getMyLoan(userId: string, reference: string) {
  return loanView(db, (await findOwned(db, userId, reference)).id);
}

export async function recordTransition(tx: Tx, application: Application, to: LoanStatus, changedBy: string | null, note: string | undefined, extra: Partial<Application> = {}) {
  await tx.update(loanApplications).set({ status: to, ...extra }).where(eq(loanApplications.id, application.id));
  await tx.insert(loanStatusHistory).values({ applicationId: application.id, oldStatus: application.status, newStatus: to, changedBy, note: note?.trim() || null });
}

export async function createLoan(userId: string, input: LoanPost["Body"]) {
  const currency = input.currency ?? "USD";
  await assertValues(db, { loanType: input.loanType, currency, requestedAmountMinor: input.requestedAmountMinor, tenureMonths: input.tenureMonths, dateOfBirth: input.dateOfBirth ?? null });

  return db.transaction(async (tx) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const [created] = await tx
        .insert(loanApplications)
        .values({ ...definedOnly(input), loanType: input.loanType, requestedAmountMinor: input.requestedAmountMinor, tenureMonths: input.tenureMonths, currency, reference: newReference("LN"), userId, status: "draft" })
        .onConflictDoNothing({ target: loanApplications.reference })
        .returning();
      if (created) {
        await tx.insert(loanStatusHistory).values({ applicationId: created.id, oldStatus: null, newStatus: "draft", changedBy: userId, note: "Application started" });
        return loanView(tx, created.id);
      }
    }
    throw new AppError("INTERNAL_ERROR", 500, "Could not allocate an application reference. Please try again.");
  });
}

export async function updateLoan(userId: string, reference: string, patch: LoanPatch["Body"]) {
  return db.transaction(async (tx) => {
    const current = await findOwned(tx, userId, reference, { lock: true });
    if (!isEditableByCustomer(current.status)) {
      throw new AppError("LOAN_NOT_EDITABLE", 409, "A submitted application can no longer be changed. Contact support if something is wrong.");
    }
    const changes = definedOnly(patch);
    await assertValues(tx, { ...current, ...changes });
    if (Object.keys(changes).length > 0) await tx.update(loanApplications).set(changes).where(eq(loanApplications.id, current.id));
    return loanView(tx, current.id);
  });
}

const REQUIRED_FIELDS = [
  "fullName", "mobile", "email", "dateOfBirth", "nationality", "currentCity", "residenceStatus",
  "employmentType", "employerName", "jobTitle", "monthlyIncomeMinor", "workExperienceMonths", "hasActiveBankAccount",
] as const;

export async function submitLoan(userId: string, reference: string, idempotencyKey: string | undefined) {
  const result = await idempotently<LoanView>({ scope: `loan:submit:${userId}`, key: idempotencyKey, userId, payload: { reference } }, async (tx) => {
    const current = await findOwned(tx, userId, reference, { lock: true });
    assertTransition(current.status, "submitted", "customer", undefined);

    const details: { path: string; message: string }[] = REQUIRED_FIELDS.filter((field) => current[field] === null || current[field] === undefined).map((field) => ({ path: field, message: "Required before submitting." }));
    const uploaded = new Set((await tx.select({ type: loanDocuments.type }).from(loanDocuments).where(eq(loanDocuments.applicationId, current.id))).map((d) => d.type));
    const missingDocuments = REQUIRED_DOCUMENTS.filter((type) => !uploaded.has(type));
    if (missingDocuments.length > 0) details.push({ path: "documents", message: `Missing: ${missingDocuments.join(", ")}.` });
    if (details.length > 0) throw new AppError("VALIDATION_ERROR", 422, "The application is not complete yet.", details);

    await assertValues(tx, current);
    await recordTransition(tx, current, "submitted", userId, "Application submitted", { submittedAt: new Date() });
    return { status: 200, body: await loanView(tx, current.id) };
  });
  return result;
}

export async function resubmitDocuments(userId: string, reference: string) {
  return db.transaction(async (tx) => {
    const current = await findOwned(tx, userId, reference, { lock: true });
    assertTransition(current.status, "documents_under_review", "customer", undefined);
    await recordTransition(tx, current, "documents_under_review", userId, "Customer sent the requested documents");
    return loanView(tx, current.id);
  });
}
