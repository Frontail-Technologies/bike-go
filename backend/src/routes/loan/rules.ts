import { AppError } from "@/libs/api";
import { convertMinor, noRateOnFile } from "@/libs/fx";
import { MINOR_EXPONENT } from "@/libs/money";
import type { Currency, FxRate } from "@/libs/types";
import type { DocumentType, LoanLimits, LoanStatus, LoanTypeId } from "./types";

export const LOAN_TYPES = ["personal", "vehicle", "emergency"] as const;

export const LOAN_STATUSES = ["draft", "submitted", "documents_under_review", "additional_documents_required", "eligibility_review", "approved", "rejected"] as const;

const USD_LIMITS: Record<LoanTypeId, { min: number; max: number; maxTenure: number }> = {
  personal: { min: 1000, max: 25000, maxTenure: 48 },
  vehicle: { min: 1500, max: 15000, maxTenure: 60 },
  emergency: { min: 500, max: 5000, maxTenure: 24 },
};

export const TENURES_MONTHS = [6, 12, 24, 36, 48, 60] as const;

export function loanLimits(type: LoanTypeId, currency: Currency, fx: Pick<FxRate, "rate" | "source" | "effectiveAt"> | null = null): LoanLimits {
  const usd = USD_LIMITS[type];
  const usdMinor = { min: usd.min * 10 ** MINOR_EXPONENT.USD, max: usd.max * 10 ** MINOR_EXPONENT.USD };
  if (currency === "USD") return { minMinor: usdMinor.min, maxMinor: usdMinor.max, maxTenure: usd.maxTenure, derivedFrom: null };
  if (!fx) throw noRateOnFile("USD", currency);
  return {
    minMinor: convertMinor(usdMinor.min, "USD", currency, fx.rate),
    maxMinor: convertMinor(usdMinor.max, "USD", currency, fx.rate),
    maxTenure: usd.maxTenure,
    derivedFrom: { rate: fx.rate, source: fx.source, effectiveAt: fx.effectiveAt },
  };
}

export const EMPLOYMENT_TYPES = ["salaried", "self_employed", "business_owner", "contract"] as const;
export const RESIDENCE_STATUSES = ["employment_visa", "investor_visa", "dependent_visa", "residence_permit", "other"] as const;

export const DOCUMENT_TYPES = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement", "other"] as const;

export const REQUIRED_DOCUMENTS: readonly DocumentType[] = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement"];

export const MIN_AGE = 21;
export const MAX_AGE = 60;

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
