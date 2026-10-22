/** Mock data and rules for the Expat Loan section. No lender, credit or KYC integration. */

export type LoanTypeId = "personal" | "vehicle" | "emergency";

export type LoanType = {
  id: LoanTypeId;
  name: string;
  description: string;
  /** Annual percentage rate, as a percent. */
  apr: number;
  minAmount: number;
  maxAmount: number;
  maxTenure: number;
};

export const loanTypes: LoanType[] = [
  { id: "personal", name: "Personal Loan", description: "Flexible tenure", apr: 12, minAmount: 1000, maxAmount: 25000, maxTenure: 48 },
  { id: "vehicle", name: "Vehicle Loan", description: "For new or used vehicles", apr: 9.5, minAmount: 1500, maxAmount: 15000, maxTenure: 60 },
  { id: "emergency", name: "Emergency Loan", description: "Quick funds when you need them", apr: 14, minAmount: 500, maxAmount: 5000, maxTenure: 24 },
];

export const getLoanType = (id: string) => loanTypes.find((t) => t.id === id);

export const TENURES = [6, 12, 24, 36, 48, 60] as const;
export const tenuresFor = (type: LoanType) => TENURES.filter((t) => t <= type.maxTenure);

/** Interest-rate range the calculator lets you explore. */
export const RATE_MIN = 6;
export const RATE_MAX = 24;

export const loanPurposes = [
  { id: "home", label: "Home setup or renovation" },
  { id: "relocation", label: "Relocation costs" },
  { id: "education", label: "Education" },
  { id: "medical", label: "Medical" },
  { id: "travel", label: "Travel" },
  { id: "other", label: "Other" },
];

export const residenceStatuses = [
  { id: "employment-visa", label: "Employment visa" },
  { id: "investor-visa", label: "Investor visa" },
  { id: "dependent-visa", label: "Dependent visa" },
  { id: "residence-permit", label: "Residence permit" },
  { id: "other", label: "Other" },
];

export const employmentTypes = [
  { id: "salaried", label: "Salaried" },
  { id: "self-employed", label: "Self-employed" },
  { id: "business-owner", label: "Business" },
  { id: "contract", label: "Contract" },
];

export const experienceBands = [
  { id: "under-1", label: "Under 1 year" },
  { id: "1-3", label: "1 to 3 years" },
  { id: "3-5", label: "3 to 5 years" },
  { id: "5-plus", label: "5+ years" },
];

export const yesNo = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export const labelOf = (list: { id: string; label: string }[], id: string) => list.find((i) => i.id === id)?.label ?? id;

// ------------------------------------------------------------------ EMI

export type Emi = { monthly: number; total: number; interest: number };

/** Standard reducing-balance EMI. Rounded to cents. */
export function calculateEmi(amount: number, apr: number, months: number): Emi {
  const r = apr / 12 / 100;
  const raw = r === 0 ? amount / months : (amount * r) / (1 - Math.pow(1 + r, -months));
  const monthly = Math.round(raw * 100) / 100;
  const total = Math.round(monthly * months * 100) / 100;
  return { monthly, total, interest: Math.round((total - amount) * 100) / 100 };
}

/** Monthly repayments should stay within this share of income. */
export const MAX_EMI_SHARE = 0.5;

// ------------------------------------------------------------------ documents

export type DocumentId = "passport" | "residence" | "employment" | "income" | "address" | "bank";

export const documentTypes: { id: DocumentId; label: string; hint: string }[] = [
  { id: "passport", label: "Passport", hint: "Photo page, valid for at least 6 months" },
  { id: "residence", label: "Visa / residence permit", hint: "Both sides if it is a card" },
  { id: "employment", label: "Employment proof", hint: "Employment letter or contract" },
  { id: "income", label: "Salary slips / income proof", hint: "Last 3 payslips" },
  { id: "address", label: "Address proof", hint: "Utility bill or tenancy agreement from the last 3 months" },
  { id: "bank", label: "Bank statement", hint: "Last 6 months" },
];

export const labelOfDocument = (id: DocumentId) => documentTypes.find((d) => d.id === id)?.label ?? id;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FILES = ".pdf,.jpg,.jpeg,.png";

export type StoredFile = { name: string; size: number };

// ------------------------------------------------------------------ applications

export type LoanStatus = "submitted" | "in-review" | "documents-required" | "approved" | "rejected";

export const statusMeta: Record<LoanStatus, { label: string; tone: "info" | "brand" | "success" | "danger"; summary: string }> = {
  submitted: { label: "Submitted", tone: "info", summary: "We have your application and will start the review shortly." },
  "in-review": { label: "In review", tone: "brand", summary: "Our team is reviewing your application. This usually takes 1 to 2 working days." },
  "documents-required": { label: "Additional documents required", tone: "brand", summary: "We need a few more documents before we can continue." },
  approved: { label: "Approved", tone: "success", summary: "Your loan is approved. Our team will contact you to arrange the next steps." },
  rejected: { label: "Rejected", tone: "danger", summary: "We could not approve this application. You are welcome to apply again with updated details." },
};

export type StatusEvent = { status: LoanStatus; at: string; note?: string };

export type Applicant = {
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  nationality: string;
  city: string;
  residence: string;
};

export type Employment = {
  type: string;
  employer: string;
  jobTitle: string;
  monthlyIncome: number;
  experience: string;
  bankAccount: string;
};

export type LoanApplication = {
  /** Public reference, also the URL id (e.g. LN410231). */
  reference: string;
  loanType: LoanTypeId;
  amount: number;
  tenure: number;
  purpose: string;
  emi: number;
  status: LoanStatus;
  applicant: Applicant;
  employment: Employment;
  documents: Partial<Record<DocumentId, StoredFile>>;
  /** Documents the reviewer asked for (status "documents-required"). */
  requestedDocuments: DocumentId[];
  history: StatusEvent[];
  createdAt: string;
};

export type LoanDraft = {
  loanType: LoanTypeId;
  amount: number;
  tenure: number;
  purpose: string;
  applicant: Applicant;
  employment: Omit<Employment, "monthlyIncome"> & { monthlyIncome: string };
  documents: Partial<Record<DocumentId, StoredFile>>;
};

export function newLoanReference() {
  return `LN${Math.floor(410500 + Math.random() * 99000)}`;
}

const file = (name: string, size: number): StoredFile => ({ name, size });
const allDocuments: LoanApplication["documents"] = {
  passport: file("passport.pdf", 812_000),
  residence: file("residence-permit.pdf", 640_000),
  employment: file("employment-letter.pdf", 410_000),
  income: file("payslips-q3.pdf", 1_240_000),
  address: file("tenancy-agreement.pdf", 980_000),
  bank: file("bank-statement.pdf", 2_100_000),
};

function seed(
  reference: string,
  loanType: LoanTypeId,
  amount: number,
  tenure: number,
  history: StatusEvent[],
  extra: Partial<LoanApplication> = {},
): LoanApplication {
  const type = getLoanType(loanType)!;
  return {
    reference,
    loanType,
    amount,
    tenure,
    purpose: "home",
    emi: calculateEmi(amount, type.apr, tenure).monthly,
    status: history[history.length - 1].status,
    applicant: {
      fullName: "Rahul Sharma",
      mobile: "+971 50 123 4567",
      email: "rahul.sharma@gmail.com",
      dob: "1992-04-18",
      nationality: "Indian",
      city: "Dubai",
      residence: "employment-visa",
    },
    employment: { type: "salaried", employer: "Northwind Logistics", jobTitle: "Operations Manager", monthlyIncome: 3200, experience: "3-5", bankAccount: "yes" },
    documents: allDocuments,
    requestedDocuments: [],
    history,
    createdAt: history[0].at,
    ...extra,
  };
}

export const seedApplications: LoanApplication[] = [
  seed("LN410231", "vehicle", 6000, 36, [
    { status: "submitted", at: "2026-10-15T09:12:00" },
    { status: "in-review", at: "2026-10-16T11:30:00" },
  ]),
  seed(
    "LN410774",
    "personal",
    4500,
    24,
    [
      { status: "submitted", at: "2026-10-12T14:05:00" },
      { status: "in-review", at: "2026-10-13T10:00:00" },
      { status: "documents-required", at: "2026-10-14T16:40:00", note: "The address proof is older than 3 months." },
    ],
    { requestedDocuments: ["address"], documents: { ...allDocuments, address: undefined } },
  ),
  seed("LN409118", "emergency", 2000, 12, [
    { status: "submitted", at: "2026-09-20T08:45:00" },
    { status: "in-review", at: "2026-09-21T09:30:00" },
    { status: "approved", at: "2026-09-23T15:10:00", note: "Approved at the requested amount." },
  ]),
  seed("LN408502", "personal", 12000, 48, [
    { status: "submitted", at: "2026-09-02T12:20:00" },
    { status: "in-review", at: "2026-09-03T10:15:00" },
    { status: "rejected", at: "2026-09-06T17:00:00", note: "Monthly repayments would be above 50% of the stated income." },
  ]),
];
