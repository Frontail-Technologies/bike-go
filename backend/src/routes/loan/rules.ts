import { AppError } from "@/libs/api";
import type { Currency } from "@/libs/money";

/**
 * Loan business rules as plain data and pure functions. They validate and route an application; they never
 * decide an outcome. There is no scoring and no automatic approval anywhere in this service.
 */

export const LOAN_TYPES = ["personal", "vehicle", "emergency"] as const;
export type LoanTypeId = (typeof LOAN_TYPES)[number];

export const LOAN_STATUSES = ["draft", "submitted", "documents_under_review", "additional_documents_required", "eligibility_review", "approved", "rejected"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

/** Placeholder exchange rate used only to express the USD limits in KHR. The business must set real limits. */
const KHR_PER_USD = 4100;

/** Limits in whole USD per loan type: min, max, longest tenure in months. */
const USD_LIMITS: Record<LoanTypeId, { min: number; max: number; maxTenure: number }> = {
  personal: { min: 1000, max: 25000, maxTenure: 48 },
  vehicle: { min: 1500, max: 15000, maxTenure: 60 },
  emergency: { min: 500, max: 5000, maxTenure: 24 },
};

export const TENURES_MONTHS = [6, 12, 24, 36, 48, 60] as const;

export function loanLimits(type: LoanTypeId, currency: Currency) {
  const usd = USD_LIMITS[type];
  const factor = currency === "KHR" ? KHR_PER_USD : 1;
  // minor units: x100 for the 2-decimal minor unit of both currencies
  return { minMinor: usd.min * factor * 100, maxMinor: usd.max * factor * 100, maxTenure: usd.maxTenure };
}

export const EMPLOYMENT_TYPES = ["salaried", "self_employed", "business_owner", "contract"] as const;
export const RESIDENCE_STATUSES = ["employment_visa", "investor_visa", "dependent_visa", "residence_permit", "other"] as const;

export const DOCUMENT_TYPES = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement", "other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Documents that must be on file before an application can be submitted. `other` is always optional. */
export const REQUIRED_DOCUMENTS: readonly DocumentType[] = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement"];

export const MIN_AGE = 21;
export const MAX_AGE = 60;

// ------------------------------------------------------------------ status transitions

/**
 * Who may move an application where. Customers can only submit a draft and send back requested documents;
 * every other move, and every decision, is made by staff.
 */
export const STAFF_TRANSITIONS: Record<LoanStatus, readonly LoanStatus[]> = {
  draft: [],
  submitted: ["documents_under_review", "rejected"],
  documents_under_review: ["additional_documents_required", "eligibility_review", "rejected"],
  additional_documents_required: ["documents_under_review", "rejected"],
  eligibility_review: ["approved", "rejected", "additional_documents_required", "documents_under_review"],
  approved: [],
  rejected: [],
};

export const CUSTOMER_TRANSITIONS: Partial<Record<LoanStatus, readonly LoanStatus[]>> = {
  draft: ["submitted"],
  additional_documents_required: ["documents_under_review"],
};

export const TERMINAL_STATUSES: readonly LoanStatus[] = ["approved", "rejected"];

/** Statuses whose move needs an explanation the customer can read. */
const NOTE_REQUIRED: readonly LoanStatus[] = ["rejected", "additional_documents_required"];

export function assertTransition(from: LoanStatus, to: LoanStatus, actor: "staff" | "customer", note: string | undefined) {
  const allowed = actor === "staff" ? STAFF_TRANSITIONS[from] : (CUSTOMER_TRANSITIONS[from] ?? []);
  if (!allowed.includes(to)) {
    throw new AppError("INVALID_LOAN_STATUS_TRANSITION", 409, `An application that is ${from.replaceAll("_", " ")} cannot move to ${to.replaceAll("_", " ")}.`, { from, to, allowed });
  }
  if (actor === "staff" && NOTE_REQUIRED.includes(to) && !note?.trim()) {
    throw new AppError("VALIDATION_ERROR", 422, `A note is required when moving to ${to.replaceAll("_", " ")}.`, [{ path: "note", message: "Required for this status." }]);
  }
}

export const isEditableByCustomer = (status: LoanStatus) => status === "draft";
