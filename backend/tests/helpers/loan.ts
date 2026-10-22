import { eq } from "drizzle-orm";
import { db } from "../../src/libs/db";
import { loanApplications, loanDocuments } from "../../src/libs/db/schema";
import { REQUIRED_DOCUMENTS } from "../../src/routes/loan/rules";
import { json } from "./http";
import { patchJson, postJson } from "./auth";

export const completeFields = (overrides: Record<string, unknown> = {}) => ({
  purpose: "Relocation costs",
  fullName: "Sokha Chan",
  mobile: "+855 12 345 678",
  email: "sokha@example.com",
  dateOfBirth: "1990-06-15",
  nationality: "Cambodian",
  currentCity: "Phnom Penh",
  residenceStatus: "employment_visa",
  employmentType: "salaried",
  employerName: "Mekong Logistics",
  jobTitle: "Operations Lead",
  monthlyIncomeMinor: 320_000,
  workExperienceMonths: 48,
  hasActiveBankAccount: true,
  ...overrides,
});

export const draftBody = (overrides: Record<string, unknown> = {}) => ({ loanType: "personal", requestedAmountMinor: 500_000, tenureMonths: 24, ...overrides });

export async function createDraft(cookie: string, overrides: Record<string, unknown> = {}) {
  const response = await postJson("/api/v1/loans", draftBody(overrides), { cookie });
  if (response.status !== 201) throw new Error(`createDraft failed: ${response.status} ${await response.text()}`);
  return (await json(response)).data as { reference: string; status: string };
}

export async function fillDraft(cookie: string, reference: string, overrides: Record<string, unknown> = {}) {
  const response = await patchJson(`/api/v1/loans/${reference}`, completeFields(overrides), { cookie });
  if (response.status !== 200) throw new Error(`fillDraft failed: ${response.status} ${await response.text()}`);
}

export async function addDocuments(reference: string, types: readonly string[] = REQUIRED_DOCUMENTS) {
  const [application] = await db.select({ id: loanApplications.id }).from(loanApplications).where(eq(loanApplications.reference, reference)).limit(1);
  await db.insert(loanDocuments).values(
    types.map((type) => ({ applicationId: application!.id, type: type as never, storageKey: `test/${reference}/${type}`, originalFilename: `${type}.pdf`, mimeType: "application/pdf", sizeBytes: 1000 })),
  );
}

export async function submittedLoan(cookie: string, overrides: Record<string, unknown> = {}) {
  const { reference } = await createDraft(cookie);
  await fillDraft(cookie, reference, overrides);
  await addDocuments(reference);
  const response = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie });
  if (response.status !== 200) throw new Error(`submit failed: ${response.status} ${await response.text()}`);
  return reference;
}
