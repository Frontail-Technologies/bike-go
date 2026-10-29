import { experienceBandFor, type LoanApplication, type LoanStatus } from "./data";
import { customerDocumentId } from "./document-types";
import type { ApiLoan } from "../types";

const status: Record<ApiLoan["status"], LoanStatus> = {
  draft: "submitted",
  submitted: "submitted",
  documents_under_review: "in-review",
  eligibility_review: "eligibility-review",
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
    emi: loan.monthlyPaymentMinor / 100,
    status: status[loan.status],
    applicant: { fullName: loan.applicant.fullName ?? "", mobile: loan.applicant.mobile ?? "", email: loan.applicant.email ?? "", dob: loan.applicant.dateOfBirth ?? "", nationality: loan.applicant.nationality ?? "", city: loan.applicant.currentCity ?? "", residence: loan.applicant.residenceStatus ?? "" },
    employment: { type: loan.employment.employmentType ?? "", employer: loan.employment.employerName ?? "", jobTitle: loan.employment.jobTitle ?? "", monthlyIncome: (loan.employment.monthlyIncomeMinor ?? 0) / 100, experience: experienceBandFor(loan.employment.workExperienceMonths), bankAccount: loan.employment.hasActiveBankAccount ? "yes" : "no" },
    documents: Object.fromEntries(loan.documents.flatMap((document) => {
      const type = customerDocumentId(document.type);
      return type ? [[type, { name: document.originalFilename, size: document.sizeBytes }] as const] : [];
    })) as LoanApplication["documents"],
    requestedDocuments: loan.requestedDocumentTypes.flatMap((type) => {
      const customerType = customerDocumentId(type);
      return customerType ? [customerType] : [];
    }),
    history: loan.history.map((event) => ({ status: status[event.newStatus], at: event.createdAt, note: event.note ?? undefined, noteCode: event.noteCode ?? undefined, noteParams: event.noteParams })),
    createdAt: loan.createdAt,
  };
}
