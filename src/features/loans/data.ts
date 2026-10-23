
export type LoanTypeId = "personal" | "vehicle" | "emergency";

export type LoanType = {
  id: LoanTypeId;
  apr: number;
  minAmount: number;
  maxAmount: number;
  maxTenure: number;
};

export const loanTypes: LoanType[] = [
  { id: "personal", apr: 12, minAmount: 1000, maxAmount: 25000, maxTenure: 48 },
  { id: "vehicle", apr: 9.5, minAmount: 1500, maxAmount: 15000, maxTenure: 60 },
  { id: "emergency", apr: 14, minAmount: 500, maxAmount: 5000, maxTenure: 24 },
];

export const getLoanType = (id: string) => loanTypes.find((t) => t.id === id);

export const TENURES = [6, 12, 24, 36, 48, 60] as const;
export const tenuresFor = (type: LoanType) => TENURES.filter((t) => t <= type.maxTenure);

export const RATE_MIN = 6;
export const RATE_MAX = 24;

export const loanPurposes = [{ id: "home" }, { id: "relocation" }, { id: "education" }, { id: "medical" }, { id: "travel" }, { id: "other" }];

export const residenceStatuses = [{ id: "employment-visa" }, { id: "investor-visa" }, { id: "dependent-visa" }, { id: "residence-permit" }, { id: "other" }];

export const employmentTypes = [{ id: "salaried" }, { id: "self-employed" }, { id: "business-owner" }, { id: "contract" }];

export const experienceBands = [{ id: "under-1" }, { id: "1-3" }, { id: "3-5" }, { id: "5-plus" }];

export type Emi = { monthly: number; total: number; interest: number };

export function calculateEmi(amount: number, apr: number, months: number): Emi {
  const r = apr / 12 / 100;
  const raw = r === 0 ? amount / months : (amount * r) / (1 - Math.pow(1 + r, -months));
  const monthly = Math.round(raw * 100) / 100;
  const total = Math.round(monthly * months * 100) / 100;
  return { monthly, total, interest: Math.round((total - amount) * 100) / 100 };
}

export const MAX_EMI_SHARE = 0.5;

export type DocumentId = "passport" | "residence" | "employment" | "income" | "address" | "bank";

export const documentTypes: { id: DocumentId }[] = [{ id: "passport" }, { id: "residence" }, { id: "employment" }, { id: "income" }, { id: "address" }, { id: "bank" }];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FILES = ".pdf,.jpg,.jpeg,.png";

export type StoredFile = { name: string; size: number };

export type LoanStatus = "submitted" | "in-review" | "documents-required" | "approved" | "rejected";

export const statusMeta: Record<LoanStatus, { tone: "info" | "brand" | "success" | "danger" }> = {
  submitted: { tone: "info" },
  "in-review": { tone: "brand" },
  "documents-required": { tone: "brand" },
  approved: { tone: "success" },
  rejected: { tone: "danger" },
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
