import { type Customer, customers } from "@/components/admin/customers/customer-data";
import { type DocumentType, documentTypes, type LoanCurrency, type LoanStatus, type LoanType } from "./loan-types";

export { type DocumentType, documentTypes };

export const NOW = Date.parse("2026-10-23T03:00:00.000Z");

export type DocumentStatus = "uploaded" | "verified" | "needs-review" | "rejected" | "missing";
export const documentStatusLabels: Record<DocumentStatus, string> = { uploaded: "Uploaded", verified: "Verified", "needs-review": "Needs review", rejected: "Rejected", missing: "Missing" };

export type LoanDocument = { type: DocumentType; status: DocumentStatus; uploadedAt: string | null; detailId: string };
export type LoanEvent = { id: string; title: string; detail?: string; at: string | null; state: "done" | "current" | "future" | "failed" };

export type Loan = {
  reference: string; status: LoanStatus; loanType: LoanType; requestedMinor: number; currency: LoanCurrency; tenureMonths: number; purpose: string; submittedAt: string;
  applicant: { customerId: string; customerReference: string; name: string; phone: string; email: string; dateOfBirth: string; nationality: string; city: string; address: string; residence: string };
  employment: { type: string; employer: string; jobTitle: string; monthlyIncomeMinor: number; experienceYears: number; activeBankAccount: boolean };
  documents: LoanDocument[]; history: LoanEvent[];
};

const employmentTypes = ["Salaried employee", "Self-employed", "Business owner", "Contract worker"];
const employers = ["Mekong Logistics Co., Ltd.", "Angkor Hospitality Group", "Phnom Penh Digital Studio", "Self-employed", "Riverside Trading", "Khmer Foods Co., Ltd."];
const jobTitles = ["Operations Manager", "Tour Operator", "Software Engineer", "Shop Owner", "Accountant", "Sales Lead"];
const purposes: Record<string, string> = { "Personal loan": "Home repairs and family expenses", "Emergency loan": "Unexpected medical bills", "Business loan": "Stock and equipment for a small shop" };

function docs(reference: string, status: LoanStatus, seed: number, submittedAt: string): LoanDocument[] {
  const at = (offset: number) => new Date(Date.parse(submittedAt) + offset * 3_600_000).toISOString();
  return documentTypes.map((type, index) => {
    let doc: DocumentStatus;
    if (status === "draft") doc = index < 2 ? "uploaded" : "missing";
    else if (status === "submitted") doc = "uploaded";
    else if (status === "documents-review") doc = index % 3 === seed % 3 ? "needs-review" : index % 2 ? "uploaded" : "verified";
    else if (status === "action-required") doc = index === 5 ? "missing" : index === 3 ? "rejected" : "verified";
    else if (status === "rejected") doc = index === 3 ? "rejected" : index % 2 ? "verified" : "uploaded";
    else doc = "verified";
    return { type, status: doc, uploadedAt: doc === "missing" ? null : at(index + 1), detailId: `${reference}-${index}` };
  });
}

function history(status: LoanStatus, submittedAt: string): LoanEvent[] {
  const at = (hours: number) => new Date(Date.parse(submittedAt) + hours * 3_600_000).toISOString();
  if (status === "draft") return [{ id: "draft", title: "Draft saved", detail: "The applicant hasn’t submitted this application yet.", at: submittedAt, state: "current" }];
  const events: LoanEvent[] = [{ id: "submitted", title: "Application submitted", at: submittedAt, state: "done" }];
  if (status === "submitted") return [{ ...events[0], state: "current" }, { id: "docs", title: "Documents under review", at: null, state: "future" }, { id: "elig", title: "Eligibility review", at: null, state: "future" }, { id: "decision", title: "Decision", at: null, state: "future" }];
  if (status === "action-required") return [...events, { id: "docs", title: "Documents under review", at: at(6), state: "done" }, { id: "request", title: "Additional documents requested", detail: "Please upload a clearer bank statement for the latest 3 months.", at: at(30), state: "current" }, { id: "elig", title: "Eligibility review", at: null, state: "future" }, { id: "decision", title: "Decision", at: null, state: "future" }];
  if (status === "documents-review") return [...events, { id: "docs", title: "Documents under review", at: at(6), state: "current" }, { id: "elig", title: "Eligibility review", at: null, state: "future" }, { id: "decision", title: "Decision", at: null, state: "future" }];
  if (status === "eligibility-review") return [...events, { id: "docs", title: "Documents verified", at: at(24), state: "done" }, { id: "elig", title: "Eligibility review", at: at(26), state: "current" }, { id: "decision", title: "Decision", at: null, state: "future" }];
  const base = [...events, { id: "docs", title: "Documents verified", at: at(24), state: "done" as const }, { id: "elig", title: "Eligibility review completed", at: at(48), state: "done" as const }];
  return status === "approved"
    ? [...base, { id: "decision", title: "Application approved", at: at(52), state: "done" }]
    : [...base, { id: "decision", title: "Application rejected", detail: "Income does not meet the minimum requirement.", at: at(52), state: "failed" }];
}

function build(customer: Customer, loan: Customer["loans"][number], index: number): Loan {
  const residenceExpat = customer.nationality !== "Cambodian";
  return {
    reference: loan.reference, status: loan.status, loanType: loan.loanType as LoanType, requestedMinor: loan.requestedMinor, currency: loan.currency, tenureMonths: loan.tenureMonths,
    purpose: purposes[loan.loanType] ?? "Personal use", submittedAt: loan.submittedAt,
    applicant: { customerId: customer.id, customerReference: customer.reference, name: customer.name, phone: customer.phone, email: customer.email, dateOfBirth: customer.dateOfBirth, nationality: customer.nationality, city: customer.city, address: customer.address, residence: residenceExpat ? "Expat resident (work visa)" : "Cambodian citizen" },
    employment: { type: employmentTypes[index % employmentTypes.length], employer: employers[index % employers.length], jobTitle: jobTitles[index % jobTitles.length], monthlyIncomeMinor: (80000 + (index % 5) * 35000), experienceYears: 2 + (index % 9), activeBankAccount: index % 6 !== 5 },
    documents: docs(loan.reference, loan.status, index, loan.submittedAt), history: history(loan.status, loan.submittedAt),
  };
}

export const loans: Loan[] = customers.flatMap((customer) => customer.loans.map((loan) => ({ customer, loan }))).map(({ customer, loan }, index) => build(customer, loan, index));

export const getLoan = (reference: string) => loans.find((loan) => loan.reference.toLowerCase() === reference.toLowerCase());

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDate = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export const canRequestDocuments = (status: LoanStatus) => status === "submitted" || status === "documents-review" || status === "eligibility-review";
export const canApprove = (status: LoanStatus) => status === "eligibility-review";
export const canReject = (status: LoanStatus) => ["submitted", "documents-review", "action-required", "eligibility-review"].includes(status);
export const isOpenForReview = (status: LoanStatus) => !["draft", "approved", "rejected"].includes(status);

export const rejectionReasons = ["Income does not meet the minimum requirement", "Documents could not be verified", "Incomplete or inconsistent information", "Residency status not eligible", "Other"] as const;
