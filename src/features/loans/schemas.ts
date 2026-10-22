import { z } from "zod";
import { formatPrice } from "@/lib/format";
import { documentTypes, getLoanType, type LoanDraft } from "./data";

export const loanDetailsSchema = z
  .object({
    loanType: z.string().min(1, "Choose a loan type."),
    amount: z.string().regex(/^\d+$/, "Enter a whole amount, for example 5000."),
    tenure: z.string().min(1, "Choose a tenure."),
    purpose: z.string().min(1, "Choose a purpose for the loan."),
  })
  .superRefine((v, ctx) => {
    const type = getLoanType(v.loanType);
    if (!type) return;
    const amount = Number(v.amount);
    if (/^\d+$/.test(v.amount) && (amount < type.minAmount || amount > type.maxAmount)) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: `Enter between ${formatPrice(type.minAmount)} and ${formatPrice(type.maxAmount)}.` });
    }
    if (Number(v.tenure) > type.maxTenure) {
      ctx.addIssue({ code: "custom", path: ["tenure"], message: `This loan runs up to ${type.maxTenure} months.` });
    }
  });

function ageOn(dob: string, today = new Date()) {
  const born = new Date(dob);
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthday = today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const personalSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name as on your passport."),
  mobile: z.string().regex(/^\+?[\d\s-]{7,16}$/, "Enter a mobile number with the country code, for example +971 50 123 4567."),
  email: z.email("Enter a valid email address."),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth.")
    .refine((v) => {
      const age = ageOn(v);
      return age >= 21 && age <= 60;
    }, "You must be between 21 and 60 years old."),
  nationality: z.string().trim().min(2, "Enter your nationality."),
  city: z.string().trim().min(2, "Enter the city you live in."),
  residence: z.string().min(1, "Choose your visa or residence status."),
});

export const employmentSchema = z.object({
  type: z.string().min(1, "Choose your employment type."),
  employer: z.string().trim().min(2, "Enter your employer or business name."),
  jobTitle: z.string().trim().min(2, "Enter your job title."),
  experience: z.string().min(1, "Choose your work experience."),
  bankAccount: z.string().min(1, "Tell us if you have an active bank account."),
  monthlyIncome: z.string().regex(/^[1-9]\d*(\.\d{1,2})?$/, "Enter your monthly income as a number, for example 3200."),
});

export const loanDetailsOf = (d: LoanDraft) => ({ loanType: d.loanType, amount: String(d.amount), tenure: String(d.tenure), purpose: d.purpose });

export const loanStepValid = (d: LoanDraft) => loanDetailsSchema.safeParse(loanDetailsOf(d)).success;
export const personalStepValid = (d: LoanDraft) => personalSchema.safeParse(d.applicant).success;
export const employmentStepValid = (d: LoanDraft) => employmentSchema.safeParse(d.employment).success;
export const documentsStepValid = (d: LoanDraft) => documentTypes.every((doc) => Boolean(d.documents[doc.id]));
