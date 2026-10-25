import { calculateEmi, type LoanApplication, type LoanStatus } from "./data";
import type { ApiLoan } from "./types";

const status: Record<ApiLoan["status"], LoanStatus> = {
  draft: "submitted",
  submitted: "submitted",
  documents_under_review: "in-review",
  additional_documents_required: "documents-required",
  approved: "approved",
  rejected: "rejected",
};

export function apiLoanToApplication(loan: ApiLoan): LoanApplication {
  if (loan.currency !== "USD") throw new Error("RideGo customer loans support USD only.");
  const amount = loan.requestedAmountMinor / 100;
  return {
    reference: loan.reference,
    loanType: loan.loanType as LoanApplication["loanType"],
    amount,
    tenure: loan.tenureMonths,
    purpose: loan.purpose ?? "other",
    emi: calculateEmi(amount, 0, loan.tenureMonths).monthly,
    status: status[loan.status],
    applicant: { fullName: loan.applicant.fullName ?? "", mobile: loan.applicant.mobile ?? "", email: loan.applicant.email ?? "", dob: loan.applicant.dateOfBirth ?? "", nationality: loan.applicant.nationality ?? "", city: loan.applicant.currentCity ?? "", residence: loan.applicant.residenceStatus ?? "" },
    employment: { type: loan.employment.employmentType ?? "", employer: loan.employment.employerName ?? "", jobTitle: loan.employment.jobTitle ?? "", monthlyIncome: (loan.employment.monthlyIncomeMinor ?? 0) / 100, experience: String(loan.employment.workExperienceMonths ?? ""), bankAccount: loan.employment.hasActiveBankAccount ? "yes" : "no" },
    documents: Object.fromEntries(loan.documents.map((document) => [document.type, { name: document.originalFilename, size: document.sizeBytes }])) as LoanApplication["documents"],
    requestedDocuments: [],
    history: loan.history.map((event) => ({ status: status[event.newStatus], at: event.createdAt, note: event.note ?? undefined })),
    createdAt: loan.createdAt,
  };
}
