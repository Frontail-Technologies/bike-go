import { z } from "zod";
import { formatPrice } from "@/lib/format";
import { documentTypes, getLoanType, type LoanDraft } from "./data";

export type ErrKey =
  | "errLoanType"
  | "errAmount"
  | "errAmountRange"
  | "errTenure"
  | "errTenureMax"
  | "errPurpose"
  | "errFullName"
  | "errMobile"
  | "errEmail"
  | "errDob"
  | "errAge"
  | "errNationality"
  | "errCity"
  | "errResidence"
  | "errEmpType"
  | "errEmployer"
  | "errJobTitle"
  | "errExperience"
  | "errBank"
  | "errIncome";

export type Say = (key: ErrKey, values?: Record<string, string | number>) => string;

export const keyOnly: Say = (key) => key;

export const loanDetailsSchema = (say: Say) =>
  z
    .object({
      loanType: z.string().min(1, say("errLoanType")),
      amount: z.string().regex(/^\d+$/, say("errAmount")),
      tenure: z.string().min(1, say("errTenure")),
      purpose: z.string().min(1, say("errPurpose")),
    })
    .superRefine((v, ctx) => {
      const type = getLoanType(v.loanType);
      if (!type) return;
      const amount = Number(v.amount);
      if (/^\d+$/.test(v.amount) && (amount < type.minAmount || amount > type.maxAmount)) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: say("errAmountRange", { min: formatPrice(type.minAmount), max: formatPrice(type.maxAmount) }) });
      }
      if (Number(v.tenure) > type.maxTenure) {
        ctx.addIssue({ code: "custom", path: ["tenure"], message: say("errTenureMax", { max: type.maxTenure }) });
      }
    });

function ageOn(dob: string, today = new Date()) {
  const born = new Date(dob);
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthday = today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const personalSchema = (say: Say) =>
  z.object({
    fullName: z.string().trim().min(2, say("errFullName")),
    mobile: z.string().regex(/^\+?[\d\s-]{7,16}$/, say("errMobile")),
    email: z.email(say("errEmail")),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, say("errDob"))
      .refine((v) => {
        const age = ageOn(v);
        return age >= 21 && age <= 60;
      }, say("errAge")),
    nationality: z.string().trim().min(2, say("errNationality")),
    city: z.string().trim().min(2, say("errCity")),
    residence: z.string().min(1, say("errResidence")),
  });

export const employmentSchema = (say: Say) =>
  z.object({
    type: z.string().min(1, say("errEmpType")),
    employer: z.string().trim().min(2, say("errEmployer")),
    jobTitle: z.string().trim().min(2, say("errJobTitle")),
    experience: z.string().min(1, say("errExperience")),
    bankAccount: z.string().min(1, say("errBank")),
    monthlyIncome: z.string().regex(/^[1-9]\d*(\.\d{1,2})?$/, say("errIncome")),
  });

export const loanDetailsOf = (d: LoanDraft) => ({ loanType: d.loanType, amount: String(d.amount), tenure: String(d.tenure), purpose: d.purpose });

export const loanStepValid = (d: LoanDraft) => loanDetailsSchema(keyOnly).safeParse(loanDetailsOf(d)).success;
export const personalStepValid = (d: LoanDraft) => personalSchema(keyOnly).safeParse(d.applicant).success;
export const employmentStepValid = (d: LoanDraft) => employmentSchema(keyOnly).safeParse(d.employment).success;
export const documentsStepValid = (d: LoanDraft) => documentTypes.every((doc) => d.documents[doc.id]?.raw instanceof File);
