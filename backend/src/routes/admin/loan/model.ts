import { t, type UnwrapModels, type UnwrapSchema } from "elysia";
import { Envelope, PaginationQuery } from "@/libs/api";
import { Loan, LoanReferenceParams, LoanStatus, LoanType } from "@/routes/loan/model";
import { LOAN_STATUSES } from "@/routes/loan/rules";

const AdminHistoryItem = t.Object({
  oldStatus: t.Nullable(LoanStatus),
  newStatus: LoanStatus,
  note: t.Nullable(t.String()),
  changedBy: t.Nullable(t.String({ format: "uuid" })),
  changedByName: t.Nullable(t.String()),
  createdAt: t.String({ format: "date-time" }),
});

export const AdminLoan = t.Object({
  ...Loan.properties,
  userId: t.String({ format: "uuid" }),
  customer: t.Object({ name: t.String(), email: t.Nullable(t.String()), phone: t.Nullable(t.String()) }),
  history: t.Array(AdminHistoryItem),
  allowedNextStatuses: t.Array(LoanStatus, { description: "Statuses staff may move this application to right now" }),
});

export const LoansGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    status: t.Optional(LoanStatus),
    loanType: t.Optional(LoanType),
    q: t.Optional(t.String({ minLength: 1, description: "Reference, applicant name, email or mobile" })),
    from: t.Optional(t.String({ format: "date-time", description: "Created at or after" })),
    to: t.Optional(t.String({ format: "date-time", description: "Created before" })),
    sort: t.Optional(t.UnionEnum(["newest", "oldest", "amount_desc", "amount_asc"])),
  }),
  Response: Envelope(t.Array(AdminLoan)),
};

export const LoanByReferenceGet = { Params: LoanReferenceParams, Response: Envelope(AdminLoan) };

export const LoanStatusPatch = {
  Params: LoanReferenceParams,
  Body: t.Object({
    status: t.UnionEnum([...LOAN_STATUSES].filter((s) => s !== "draft") as [string, ...string[]]),
    note: t.Optional(t.String({ minLength: 2, maxLength: 1000, description: "Shown to the applicant. Required for rejected and additional_documents_required" })),
  }),
  Response: Envelope(AdminLoan),
};

export type AdminLoanView = UnwrapSchema<typeof AdminLoan>;
export type LoansGet = UnwrapModels<typeof LoansGet>;
export type LoanStatusPatch = UnwrapModels<typeof LoanStatusPatch>;
