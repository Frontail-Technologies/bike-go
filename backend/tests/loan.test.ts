import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { loanApplications, loanStatusHistory } from "../src/libs/db/schema";
import { assertTransition, loanLimits, LOAN_STATUSES, STAFF_TRANSITIONS } from "../src/routes/loan/rules";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { addDocuments, completeFields, createDraft, draftBody, fillDraft, submittedLoan } from "./helpers/loan";
import type { LoanStatus } from "../src/routes/loan/types";

const setStatus = (cookie: string, reference: string, status: string, note?: string) => patchJson(`/api/v1/admin/loans/${reference}/status`, { status, ...(note ? { note } : {}) }, { cookie });
const getLoan = async (cookie: string, reference: string) => (await json(await request(`/api/v1/loans/${reference}`, { cookie }))).data;

describe("transition rules (pure)", () => {
  test("staff can only follow the map, and terminal states go nowhere", () => {
    for (const from of LOAN_STATUSES) {
      for (const to of LOAN_STATUSES) {
        const allowed = STAFF_TRANSITIONS[from].includes(to);
        const attempt = () => assertTransition(from, to, "staff", "a note");
        if (allowed) expect(attempt).not.toThrow();
        else expect(attempt).toThrow();
      }
    }
    expect(STAFF_TRANSITIONS.approved).toEqual([]);
    expect(STAFF_TRANSITIONS.rejected).toEqual([]);
  });

  test("customers can only submit a draft or send back requested documents", () => {
    expect(() => assertTransition("draft", "submitted", "customer", undefined)).not.toThrow();
    expect(() => assertTransition("additional_documents_required", "documents_under_review", "customer", undefined)).not.toThrow();
    for (const to of ["approved", "rejected", "eligibility_review", "documents_under_review"] as LoanStatus[]) {
      expect(() => assertTransition("submitted", to, "customer", "x")).toThrow();
    }
    expect(() => assertTransition("draft", "approved", "customer", undefined)).toThrow();
  });

  test("rejections and document requests need a note", () => {
    expect(() => assertTransition("submitted", "rejected", "staff", undefined)).toThrow();
    expect(() => assertTransition("submitted", "rejected", "staff", "   ")).toThrow();
    expect(() => assertTransition("documents_under_review", "additional_documents_required", "staff", undefined)).toThrow();
    expect(() => assertTransition("eligibility_review", "approved", "staff", undefined)).not.toThrow();
  });

  test("USD loan limits are native", () => {
    expect(loanLimits("personal", "USD")).toMatchObject({ minMinor: 100_000, maxMinor: 2_500_000, maxTenure: 48, derivedFrom: null });
  });
});

describe("draft", () => {
  test("a draft is created with history and can be updated", async () => {
    const { cookie } = await signInCustomer();
    const created = await postJson("/api/v1/loans", draftBody(), { cookie });
    expect(created.status).toBe(201);
    const draft = (await json(created)).data;
    expect(draft).toMatchObject({ status: "draft", editable: true, loanType: "personal", currency: "USD", requestedAmountMinor: 500_000, tenureMonths: 24 });
    expect(draft.reference).toMatch(/^LN\d{8}$/);
    expect(draft.history).toHaveLength(1);
    expect(draft.history[0]).toMatchObject({ oldStatus: null, newStatus: "draft", by: "you" });

    const updated = await patchJson(`/api/v1/loans/${draft.reference}`, { requestedAmountMinor: 800_000, fullName: "Sokha Chan", employerName: "Mekong Logistics" }, { cookie });
    expect(updated.status).toBe(200);
    expect((await json(updated)).data).toMatchObject({ requestedAmountMinor: 800_000, applicant: { fullName: "Sokha Chan" }, employment: { employerName: "Mekong Logistics" } });
    expect((await patchJson(`/api/v1/loans/${draft.reference}`, { tenureMonths: 36 }, { cookie })).status).toBe(200);
  });

  test("invalid values are 422 and change nothing", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const cases: Record<string, Record<string, unknown>> = {
      "amount above the loan's maximum": { requestedAmountMinor: 99_999_999 },
      "amount below the minimum": { requestedAmountMinor: 100 },
      "tenure not on offer": { tenureMonths: 7 },
      "tenure longer than this loan allows": { tenureMonths: 60 },
      "under 21": { dateOfBirth: "2015-01-01" },
      "over 60": { dateOfBirth: "1950-01-01" },
      "not a real date": { dateOfBirth: "1990-02-31" },
      "bad mobile": { mobile: "abc" },
      "bad email": { email: "not-an-email" },
      "unknown employment type": { employmentType: "pirate" },
      "negative income": { monthlyIncomeMinor: -5 },
    };
    for (const [name, body] of Object.entries(cases)) {
      const response = await patchJson(`/api/v1/loans/${reference}`, body, { cookie });
      expect({ name, status: response.status }).toEqual({ name, status: 422 });
    }
    expect((await getLoan(cookie, reference)).requestedAmountMinor).toBe(500_000);
  });

  test("status, reference, owner and timestamps cannot be written by a client", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    for (const body of [{ status: "approved" }, { reference: "LN00000000" }, { userId: "00000000-0000-4000-8000-000000000000" }, { submittedAt: "2030-01-01T00:00:00Z" }]) {
      expect((await patchJson(`/api/v1/loans/${reference}`, body, { cookie })).status).toBe(422);
    }
    expect((await postJson("/api/v1/loans", draftBody({ status: "approved" }), { cookie })).status).toBe(422);
    const loan = await getLoan(cookie, reference);
    expect(loan.status).toBe("draft");
    expect(loan.reference).toBe(reference);
  });
});

describe("submitting", () => {
  test("an incomplete draft cannot be submitted, and the response says what is missing", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const response = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie });
    expect(response.status).toBe(422);
    const body = await json(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    const paths = body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toContain("fullName");
    expect(paths).toContain("monthlyIncomeMinor");
    expect(paths).toContain("documents");
    expect((await getLoan(cookie, reference)).status).toBe("draft");
  });

  test("documents are required too", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    await fillDraft(cookie, reference);
    await addDocuments(reference, ["passport", "address_proof"]);
    const response = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie });
    expect(response.status).toBe(422);
    const message = (await json(response)).error.details.find((d: { path: string }) => d.path === "documents").message;
    expect(message).toContain("visa_or_residence_permit");
    expect(message).not.toContain("passport");
  });

  test("a complete draft submits, stamping the time and the history", async () => {
    const { cookie } = await signInCustomer();
    const reference = await submittedLoan(cookie);
    const loan = await getLoan(cookie, reference);
    expect(loan).toMatchObject({ status: "submitted", editable: false });
    expect(loan.submittedAt).not.toBeNull();
    expect(loan.history.map((h: { newStatus: string }) => h.newStatus)).toEqual(["draft", "submitted"]);
    expect(loan.history[1]).toMatchObject({ oldStatus: "draft", by: "you" });
  });

  test("submitting twice is refused, but retrying with an Idempotency-Key replays the result", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    await fillDraft(cookie, reference);
    await addDocuments(reference);

    const first = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie, headers: { "idempotency-key": "submit-key-0001" } });
    const retry = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie, headers: { "idempotency-key": "submit-key-0001" } });
    expect(first.status).toBe(200);
    expect(retry.status).toBe(200);
    expect(retry.headers.get("idempotent-replayed")).toBe("true");
    expect((await json(retry)).data.status).toBe("submitted");

    const again = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie });
    expect(again.status).toBe(409);
    expect(await json(again)).toMatchObject({ error: { code: "INVALID_LOAN_STATUS_TRANSITION" } });

    const [app] = await db.select({ id: loanApplications.id }).from(loanApplications).where(eq(loanApplications.reference, reference));
    const submittedEntries = (await db.select().from(loanStatusHistory).where(eq(loanStatusHistory.applicationId, app!.id))).filter((h) => h.newStatus === "submitted");
    expect(submittedEntries.length).toBe(1);
  });
});

describe("submitted data is immutable", () => {
  test("a submitted application cannot be edited, whatever is sent", async () => {
    const { cookie } = await signInCustomer();
    const reference = await submittedLoan(cookie);
    const before = await getLoan(cookie, reference);

    for (const body of [{ requestedAmountMinor: 100_000 }, { fullName: "Someone Else" }, { monthlyIncomeMinor: 99_999_999 }, { purpose: "Changed" }]) {
      const response = await patchJson(`/api/v1/loans/${reference}`, body, { cookie });
      expect(response.status).toBe(409);
      expect(await json(response)).toMatchObject({ error: { code: "LOAN_NOT_EDITABLE" } });
    }
    const after = await getLoan(cookie, reference);
    expect({ ...after, updatedAt: undefined }).toEqual({ ...before, updatedAt: undefined });
  });

  test("staff status changes do not alter the applicant's submitted data", async () => {
    const { cookie } = await signInCustomer();
    const { cookie: staff } = await signInAdmin();
    const reference = await submittedLoan(cookie);
    const before = await getLoan(cookie, reference);
    await setStatus(staff, reference, "documents_under_review");
    const after = await getLoan(cookie, reference);
    expect(after.applicant).toEqual(before.applicant);
    expect(after.employment).toEqual(before.employment);
    expect(after.requestedAmountMinor).toBe(before.requestedAmountMinor);
  });
});

describe("ownership", () => {
  test("another customer cannot read, edit or submit someone else's application", async () => {
    const owner = await signInCustomer();
    const stranger = await signInCustomer();
    const { reference } = await createDraft(owner.cookie);
    await fillDraft(owner.cookie, reference);
    await addDocuments(reference);

    expect((await request(`/api/v1/loans/${reference}`, { cookie: stranger.cookie })).status).toBe(404);
    expect((await patchJson(`/api/v1/loans/${reference}`, { purpose: "Hijack" }, { cookie: stranger.cookie })).status).toBe(404);
    expect((await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie: stranger.cookie })).status).toBe(404);
    expect((await postJson(`/api/v1/loans/${reference}/resubmit`, {}, { cookie: stranger.cookie })).status).toBe(404);

    expect((await json(await request("/api/v1/loans", { cookie: stranger.cookie }))).data).toEqual([]);
    expect((await json(await request("/api/v1/loans", { cookie: owner.cookie }))).data.map((l: { reference: string }) => l.reference)).toEqual([reference]);
    expect((await getLoan(owner.cookie, reference)).status).toBe("draft");
  });

  test("every loan route needs a session", async () => {
    expect((await request("/api/v1/loans")).status).toBe(401);
    expect((await postJson("/api/v1/loans", draftBody())).status).toBe(401);
    expect((await request("/api/v1/loans/LN12345678")).status).toBe(401);
    expect((await patchJson("/api/v1/loans/LN12345678", {})).status).toBe(401);
    expect((await postJson("/api/v1/loans/LN12345678/submit", {})).status).toBe(401);
  });
});

describe("decisions are staff-only", () => {
  test("a customer cannot approve, reject or move their own application", async () => {
    const { cookie } = await signInCustomer();
    const reference = await submittedLoan(cookie);
    for (const status of ["approved", "rejected", "eligibility_review", "documents_under_review"]) {
      const response = await setStatus(cookie, reference, status, "please");
      expect(response.status).toBe(403);
    }
    expect((await patchJson(`/api/v1/loans/${reference}`, { status: "approved" }, { cookie })).status).toBe(422);
    expect((await getLoan(cookie, reference)).status).toBe("submitted");
  });

  test("anonymous callers get 401 on the admin routes", async () => {
    expect((await patchJson("/api/v1/admin/loans/LN12345678/status", { status: "approved" })).status).toBe(401);
    expect((await request("/api/v1/admin/loans")).status).toBe(401);
  });

  test("staff walk an application through review to approval, and every step is recorded", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);

    expect((await setStatus(staff.cookie, reference, "documents_under_review")).status).toBe(200);
    expect((await setStatus(staff.cookie, reference, "eligibility_review")).status).toBe(200);
    const approved = await setStatus(staff.cookie, reference, "approved", "Approved at the requested amount.");
    expect(approved.status).toBe(200);
    expect((await json(approved)).data.allowedNextStatuses).toEqual([]);

    const loan = await getLoan(cookie, reference);
    expect(loan.status).toBe("approved");
    expect(loan.history.map((h: { newStatus: string }) => h.newStatus)).toEqual(["draft", "submitted", "documents_under_review", "eligibility_review", "approved"]);
    expect(loan.history[4]).toMatchObject({ oldStatus: "eligibility_review", note: "Approved at the requested amount.", by: "staff" });

    const detail = (await json(await request(`/api/v1/admin/loans/${reference}`, { cookie: staff.cookie }))).data;
    expect(detail.history[4].changedBy).toBe(staff.userId);
    expect(detail.customer.name).toBeTruthy();
  });

  test("invalid transitions are refused with a stable code", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);

    const skip = await setStatus(staff.cookie, reference, "approved", "straight to approved");
    expect(skip.status).toBe(409);
    expect(await json(skip)).toMatchObject({ error: { code: "INVALID_LOAN_STATUS_TRANSITION" } });

    await setStatus(staff.cookie, reference, "rejected", "Income below the minimum.");
    const reopen = await setStatus(staff.cookie, reference, "documents_under_review");
    expect(reopen.status).toBe(409);
    expect((await getLoan(cookie, reference)).status).toBe("rejected");
  });

  test("a draft cannot be moved by staff", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const { reference } = await createDraft(cookie);
    expect((await setStatus(staff.cookie, reference, "approved", "Not allowed on a draft")).status).toBe(409);
    expect((await setStatus(staff.cookie, reference, "submitted")).status).toBe(409);
  });

  test("a rejection or a document request needs a note", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);
    await setStatus(staff.cookie, reference, "documents_under_review");

    expect((await setStatus(staff.cookie, reference, "rejected")).status).toBe(422);
    expect((await setStatus(staff.cookie, reference, "additional_documents_required")).status).toBe(422);
    expect((await getLoan(cookie, reference)).status).toBe("documents_under_review");
  });

  test("the customer can send back requested documents, but only when they were requested", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);

    expect((await postJson(`/api/v1/loans/${reference}/resubmit`, {}, { cookie })).status).toBe(409);

    await setStatus(staff.cookie, reference, "documents_under_review");
    await setStatus(staff.cookie, reference, "additional_documents_required", "The address proof is older than 3 months.");
    const asked = await getLoan(cookie, reference);
    expect(asked.status).toBe("additional_documents_required");
    expect(asked.history.at(-1).note).toBe("The address proof is older than 3 months.");

    const resent = await postJson(`/api/v1/loans/${reference}/resubmit`, {}, { cookie });
    expect(resent.status).toBe(200);
    expect((await json(resent)).data).toMatchObject({ status: "documents_under_review" });
  });
});

describe("admin list", () => {
  test("filters by status and reference search, and paginates", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const a = await submittedLoan(cookie, { fullName: "Findable Person" });
    await setStatus(staff.cookie, a, "documents_under_review");
    await submittedLoan(cookie);

    const byStatus = await json(await request("/api/v1/admin/loans?status=documents_under_review", { cookie: staff.cookie }));
    expect(byStatus.data.some((l: { reference: string }) => l.reference === a)).toBe(true);
    expect(byStatus.data.every((l: { status: string }) => l.status === "documents_under_review")).toBe(true);

    const search = await json(await request(`/api/v1/admin/loans?q=${a}`, { cookie: staff.cookie }));
    expect(search.data.map((l: { reference: string }) => l.reference)).toEqual([a]);
    const byName = await json(await request("/api/v1/admin/loans?q=Findable", { cookie: staff.cookie }));
    expect(byName.data.some((l: { reference: string }) => l.reference === a)).toBe(true);

    const paged = await json(await request("/api/v1/admin/loans?pageSize=1&page=1", { cookie: staff.cookie }));
    expect(paged.data).toHaveLength(1);
    expect(paged.meta.total).toBeGreaterThanOrEqual(2);
    expect((await request("/api/v1/admin/loans", { cookie })).status).toBe(403);
  });
});

void completeFields;
