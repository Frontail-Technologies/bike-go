import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdAt, id, minor, timestamptz, updatedAt } from "./columns";
import { currency } from "./enums";

export const loanStatus = pgEnum("loan_status", [
  "draft",
  "submitted",
  "documents_under_review",
  "additional_documents_required",
  "eligibility_review",
  "approved",
  "rejected",
]);

export const loanType = pgEnum("loan_type", ["personal", "vehicle", "emergency"]);

/**
 * An Expat Loan application. The personal and employment fields are a snapshot taken from the form: they are
 * nullable only while the application is a draft, and `submit` refuses to proceed until they are all present.
 * Nothing here decides an outcome; approval and rejection are manual admin decisions.
 */
export const loanApplications = pgTable(
  "loan_applications",
  {
    id: id(),
    reference: text("reference").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: loanStatus("status").notNull().default("draft"),
    loanType: loanType("loan_type").notNull(),
    currency: currency("currency").notNull().default("USD"),
    requestedAmountMinor: minor("requested_amount_minor").notNull(),
    tenureMonths: integer("tenure_months").notNull(),
    purpose: text("purpose"),

    fullName: text("full_name"),
    mobile: text("mobile"),
    email: text("email"),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    nationality: text("nationality"),
    currentCity: text("current_city"),
    residenceStatus: text("residence_status"),

    employmentType: text("employment_type"),
    employerName: text("employer_name"),
    jobTitle: text("job_title"),
    monthlyIncomeMinor: minor("monthly_income_minor"),
    workExperienceMonths: integer("work_experience_months"),
    hasActiveBankAccount: boolean("has_active_bank_account"),

    submittedAt: timestamptz("submitted_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("loan_applications_user_created_idx").on(table.userId, table.createdAt),
    index("loan_applications_status_idx").on(table.status),
    check("loan_applications_amount_positive", sql`${table.requestedAmountMinor} > 0`),
    check("loan_applications_tenure_positive", sql`${table.tenureMonths} > 0`),
  ],
);

/** Every status change, with who made it. The current status on the application is a convenience, this is the record. */
export const loanStatusHistory = pgTable(
  "loan_status_history",
  {
    id: id(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => loanApplications.id, { onDelete: "cascade" }),
    oldStatus: loanStatus("old_status"),
    newStatus: loanStatus("new_status").notNull(),
    changedBy: uuid("changed_by").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: createdAt(),
  },
  (table) => [index("loan_status_history_application_idx").on(table.applicationId, table.createdAt)],
);
