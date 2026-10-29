import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import type { DocumentType, Loan, LoanStatus, LoanType, VerificationStatus } from "../types/loan";

export const loanStatusLabels: Record<LoanStatus, string> = {
  draft: "Draft", submitted: "Submitted", documents_under_review: "Documents under review", additional_documents_required: "Additional documents required",
  eligibility_review: "Eligibility review", approved: "Approved", rejected: "Rejected",
};

const loanTone: Record<LoanStatus, AdminStatus> = {
  draft: "draft", submitted: "submitted", documents_under_review: "under-review", additional_documents_required: "action-required", eligibility_review: "eligibility", approved: "approved", rejected: "rejected",
};

const legacy: Record<string, LoanStatus> = { "documents-review": "documents_under_review", "action-required": "additional_documents_required", "eligibility-review": "eligibility_review" };
export const normalizeLoanStatus = (status: string) => (legacy[status] ?? status) as LoanStatus;
export const toLoanBadge = (status: string) => {
  const key = normalizeLoanStatus(status);
  return { status: loanTone[key] ?? ("pending" as AdminStatus), label: loanStatusLabels[key] ?? status };
};

export const loanTypeLabels: Record<LoanType, string> = { personal: "Personal loan", vehicle: "Vehicle loan", emergency: "Emergency loan" };
export const loanTypeLabel = (type: string) => loanTypeLabels[type as LoanType] ?? type;

export const documentTypeLabels: Record<DocumentType, string> = {
  passport: "Passport", visa_or_residence_permit: "Visa / Residence permit", employment_proof: "Employment proof", salary_or_income_proof: "Salary / income proof",
  address_proof: "Address proof", bank_statement: "Bank statement", other: "Other",
};
export const documentTypeLabel = (type: string) => documentTypeLabels[type as DocumentType] ?? type;
export const requiredDocumentTypes: readonly DocumentType[] = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement"];

export const verificationLabels: Record<VerificationStatus, string> = { uploaded: "Uploaded", verified: "Verified", needs_review: "Needs review", rejected: "Rejected" };
const verificationTone: Record<VerificationStatus, AdminStatus> = { uploaded: "submitted", verified: "verified", needs_review: "needs-review", rejected: "rejected" };
export const toVerificationBadge = (status: string) => ({ status: verificationTone[status as VerificationStatus] ?? ("pending" as AdminStatus), label: verificationLabels[status as VerificationStatus] ?? status });

export const residenceLabels: Record<string, string> = { employment_visa: "Employment visa", investor_visa: "Investor visa", dependent_visa: "Dependent visa", residence_permit: "Residence permit", other: "Other" };
export const employmentLabels: Record<string, string> = { salaried: "Salaried employee", self_employed: "Self-employed", business_owner: "Business owner", contract: "Contract worker" };

export const rejectionReasons = ["Income does not meet the minimum requirement", "Documents could not be verified", "Incomplete or inconsistent information", "Residency status not eligible", "Other"] as const;

export const reviewStatusOptions = (loan: Pick<Loan, "allowedNextStatuses">): LoanStatus[] =>
  loan.allowedNextStatuses.filter((status) => status === "documents_under_review" || status === "eligibility_review");

export const canMoveTo = (loan: Pick<Loan, "allowedNextStatuses">, status: LoanStatus) => loan.allowedNextStatuses.includes(status);
export const isOpenForReview = (status: LoanStatus) => !["draft", "approved", "rejected"].includes(status);

export const ageOf = (iso: string, now: number) => Math.floor((now - Date.parse(iso)) / (365.25 * 86_400_000));
export const monthsToYears = (months: number) => (months % 12 === 0 ? `${months / 12} years` : `${(months / 12).toFixed(1)} years`);

export const loanDocumentPath = (reference: string, documentId: string) => `/api/v1/admin/loans/${reference}/documents/${documentId}/file`;
