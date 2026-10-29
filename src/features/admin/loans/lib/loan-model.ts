import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import { adminLabels, adminT } from "@/features/admin/i18n/translate";
import { documentTypes, loanStatuses, loanTypes, verificationStatuses, type DocumentType, type Loan, type LoanStatus, type LoanType, type VerificationStatus } from "../types/loan";
import { legacyLoanStatus, loanStatus } from "@/lib/status/loan";

export const loanStatusLabels = adminLabels("loans.status", loanStatuses);

const loanTone = Object.fromEntries(Object.entries(loanStatus).map(([code, meta]) => [code, meta.tone])) as Record<LoanStatus, AdminStatus>;

export const normalizeLoanStatus = (status: string) => (legacyLoanStatus[status] ?? status) as LoanStatus;
export const toLoanBadge = (status: string) => {
  const key = normalizeLoanStatus(status);
  return { status: loanTone[key] ?? ("pending" as AdminStatus), label: loanStatusLabels[key] ?? status };
};

export const loanTypeLabels: Record<LoanType, string> = adminLabels("loans.types", loanTypes);
export const loanTypeLabel = (type: string) => loanTypeLabels[type as LoanType] ?? type;

export const documentTypeLabels: Record<DocumentType, string> = adminLabels("loans.documentTypes", documentTypes);
export const documentTypeLabel = (type: string) => documentTypeLabels[type as DocumentType] ?? type;
export const requiredDocumentTypes: readonly DocumentType[] = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement"];

export const verificationLabels: Record<VerificationStatus, string> = adminLabels("loans.verification", verificationStatuses);
const verificationTone: Record<VerificationStatus, AdminStatus> = { uploaded: "submitted", verified: "verified", needs_review: "needs-review", rejected: "rejected" };
export const toVerificationBadge = (status: string) => ({ status: verificationTone[status as VerificationStatus] ?? ("pending" as AdminStatus), label: verificationLabels[status as VerificationStatus] ?? status });

export const residenceLabels: Record<string, string> = adminLabels("loans.residence", ["employment_visa", "investor_visa", "dependent_visa", "residence_permit", "other"]);
export const employmentLabels: Record<string, string> = adminLabels("loans.employment", ["salaried", "self_employed", "business_owner", "contract"]);

export const rejectionReasons = ["Income does not meet the minimum requirement", "Documents could not be verified", "Incomplete or inconsistent information", "Residency status not eligible", "Other"] as const;
export const rejectionReasonLabel = (reason: string) => adminT(`loans.rejection.${reason}`);

export const reviewStatusOptions = (loan: Pick<Loan, "allowedNextStatuses">): LoanStatus[] =>
  loan.allowedNextStatuses.filter((status) => status === "documents_under_review" || status === "eligibility_review");

export const canMoveTo = (loan: Pick<Loan, "allowedNextStatuses">, status: LoanStatus) => loan.allowedNextStatuses.includes(status);
export const isOpenForReview = (status: LoanStatus) => !["draft", "approved", "rejected"].includes(status);

export const ageOf = (iso: string, now: number) => Math.floor((now - Date.parse(iso)) / (365.25 * 86_400_000));
export const monthsToYears = (months: number) => adminT("loans.years", { count: months % 12 === 0 ? months / 12 : (months / 12).toFixed(1) });

export const loanDocumentPath = (reference: string, documentId: string) => `/api/v1/admin/loans/${reference}/documents/${documentId}/file`;
