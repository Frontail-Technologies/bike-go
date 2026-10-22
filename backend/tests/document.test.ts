import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { env } from "../src/env";
import { db } from "../src/libs/db";
import { loanDocuments } from "../src/libs/db/schema";
import { storage } from "../src/providers/storage";
import { LocalStorageProvider } from "../src/providers/storage/local";
import { MAX_FILE_BYTES, sanitizeFilename } from "../src/routes/document/service";
import { REQUIRED_DOCUMENTS } from "../src/routes/loan/rules";
import { fakeS3 } from "./helpers/fake-s3";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { createDraft, fillDraft, submittedLoan } from "./helpers/loan";

const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const EXE = Uint8Array.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]);

const upload = (cookie: string | undefined, reference: string, type: string, bytes: Uint8Array | null, name = "scan.pdf") => {
  const form = new FormData();
  if (bytes) form.set("file", new File([bytes as BlobPart], name));
  form.set("type", type);
  return request(`/api/v1/loans/${reference}/documents`, { method: "POST", body: form, ...(cookie ? { cookie } : {}) });
};

const review = (cookie: string, reference: string, id: string, body: Record<string, unknown>) => patchJson(`/api/v1/admin/loans/${reference}/documents/${id}/review`, body, { cookie });

describe("filenames and storage keys", () => {
  test("filenames are reduced to a safe display name", () => {
    expect(sanitizeFilename("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFilename("C:\\Users\\me\\scan 1.pdf")).toBe("scan 1.pdf");
    expect(sanitizeFilename("na\u0000me\u001f.pdf")).toBe("name.pdf");
    expect(sanitizeFilename("<script>alert(1)</script>.png")).not.toContain("<");
    expect(sanitizeFilename("....")).toBe("document");
    expect(sanitizeFilename("a".repeat(500) + ".pdf").length).toBeLessThanOrEqual(120);
  });

  test("the local provider refuses keys that could escape its folder", async () => {
    const local = new LocalStorageProvider("./.pglite/storage-unit-test");
    for (const key of ["../outside.pdf", "a/../../b.pdf", "/etc/passwd", "C:/windows/x", "a b.pdf", ""]) {
      await expect(local.put(key, PDF, { contentType: "application/pdf" })).rejects.toThrow();
    }
    await local.put("loans/ok/file.pdf", PDF, { contentType: "application/pdf" });
    expect(await local.get("loans/ok/file.pdf")).toEqual(PDF);
    await local.delete("loans/ok/file.pdf");
    expect(await local.get("loans/ok/file.pdf")).toBeNull();
  });
});

describe("uploading", () => {
  test("a PDF, a JPEG and a PNG are accepted, stored privately, and described without the storage key", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);

    const responses = [await upload(cookie, reference, "passport", PDF, "passport.pdf"), await upload(cookie, reference, "address_proof", JPEG, "bill.jpg"), await upload(cookie, reference, "bank_statement", PNG, "statement.png")];
    expect(responses.map((r) => r.status)).toEqual([201, 201, 201]);
    const bodies = await Promise.all(responses.map((r) => json(r)));
    expect(bodies.map((b) => b.data.mimeType)).toEqual(["application/pdf", "image/jpeg", "image/png"]);
    expect(bodies[0].data).toMatchObject({ type: "passport", originalFilename: "passport.pdf", sizeBytes: PDF.byteLength, verificationStatus: "uploaded", reviewNote: null });

    const list = await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }));
    expect(list.data).toHaveLength(3);
    const everything = JSON.stringify([bodies, list, await json(await request(`/api/v1/loans/${reference}`, { cookie }))]);
    expect(everything).not.toContain("storageKey");
    expect(everything).not.toContain("loans/");
  });

  test("documents are stored in R2 under server-generated keys and removed from it on delete", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const created = (await json(await upload(cookie, reference, "passport", PDF, "my passport.pdf"))).data;
    const [row] = await db.select().from(loanDocuments).where(eq(loanDocuments.id, created.id));

    expect(row?.storageKey).toMatch(/^loans\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/);
    const stored = fakeS3().objects.get(row!.storageKey);
    expect(stored?.contentType).toBe("application/pdf");
    expect(stored?.bytes).toEqual(PDF);
    expect(JSON.stringify(await json(await request(`/api/v1/loans/${reference}/documents`, { cookie })))).not.toContain(row!.storageKey);

    await request(`/api/v1/loans/${reference}/documents/${created.id}`, { cookie, method: "DELETE" });
    expect(fakeS3().objects.has(row!.storageKey)).toBe(false);
  });

  test("the real file type is checked, not the name", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    for (const [bytes, name] of [[EXE, "totally-a-pdf.pdf"], [new TextEncoder().encode("just some text"), "notes.pdf"], [new Uint8Array([1, 2, 3, 4]), "photo.png"]] as const) {
      const response = await upload(cookie, reference, "passport", bytes, name);
      expect({ name, status: response.status }).toEqual({ name, status: 422 });
      expect((await json(response)).error.code).toBe("DOCUMENT_TYPE_INVALID");
    }
    expect((await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data).toEqual([]);
  });

  test("an oversized file is FILE_TOO_LARGE", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const big = new Uint8Array(MAX_FILE_BYTES + 1);
    big.set(PDF);
    const response = await upload(cookie, reference, "passport", big, "big.pdf");
    expect(response.status).toBe(413);
    expect((await json(response)).error.code).toBe("FILE_TOO_LARGE");
  });

  test("a moderately oversized upload (9 MB, above the document limit and below the server body cap) is still our structured 413", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const big = new Uint8Array(9 * 1024 * 1024);
    big.set(PDF);
    const response = await upload(cookie, reference, "passport", big, "big.pdf");
    expect(response.status).toBe(413);
    expect(await json(response)).toMatchObject({ success: false, error: { code: "FILE_TOO_LARGE" } });
    expect((await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data).toEqual([]);
  });

  test("the server body cap sits above the document limit", () => {
    expect(env.MAX_REQUEST_BODY_BYTES).toBeGreaterThan(MAX_FILE_BYTES * 2);
  });

  test("an unknown document type and a missing file are rejected", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const badType = await upload(cookie, reference, "selfie", PDF);
    expect(badType.status).toBe(422);
    expect((await json(badType)).error.code).toBe("DOCUMENT_TYPE_INVALID");
    expect((await upload(cookie, reference, "passport", null)).status).toBe(422);
  });

  test("a hostile filename is stored sanitised, and the storage key ignores it", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const body = await json(await upload(cookie, reference, "passport", PDF, "../../../etc/passwd.pdf"));
    expect(body.data.originalFilename).toBe("passwd.pdf");
    const [row] = await db.select().from(loanDocuments).where(eq(loanDocuments.id, body.data.id));
    expect(row?.storageKey).toMatch(/^loans\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/);
  });

  test("at most five files per type", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    for (let i = 0; i < 5; i++) expect((await upload(cookie, reference, "bank_statement", PDF)).status).toBe(201);
    expect((await upload(cookie, reference, "bank_statement", PDF)).status).toBe(422);
    expect((await upload(cookie, reference, "passport", PDF)).status).toBe(201);
  });
});

describe("access", () => {
  test("only the owner can list, upload, download or delete", async () => {
    const owner = await signInCustomer();
    const stranger = await signInCustomer();
    const { reference } = await createDraft(owner.cookie);
    const created = (await json(await upload(owner.cookie, reference, "passport", PDF))).data;

    expect((await request(`/api/v1/loans/${reference}/documents`, { cookie: stranger.cookie })).status).toBe(404);
    expect((await upload(stranger.cookie, reference, "passport", PDF)).status).toBe(404);
    expect((await request(`/api/v1/loans/${reference}/documents/${created.id}/file`, { cookie: stranger.cookie })).status).toBe(404);
    expect((await request(`/api/v1/loans/${reference}/documents/${created.id}`, { cookie: stranger.cookie, method: "DELETE" })).status).toBe(404);
    expect((await json(await request(`/api/v1/loans/${reference}/documents`, { cookie: owner.cookie }))).data).toHaveLength(1);

    const mine = await createDraft(stranger.cookie);
    expect((await request(`/api/v1/loans/${mine.reference}/documents/${created.id}/file`, { cookie: stranger.cookie })).status).toBe(404);
  });

  test("every document route needs a session", async () => {
    expect((await request("/api/v1/loans/LN12345678/documents")).status).toBe(401);
    expect((await upload(undefined, "LN12345678", "passport", PDF)).status).toBe(401);
    expect((await request("/api/v1/loans/LN12345678/documents/00000000-0000-4000-8000-000000000000/file")).status).toBe(401);
  });

  test("the owner downloads the exact bytes as a private attachment", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const created = (await json(await upload(cookie, reference, "passport", PDF, "my passport.pdf"))).data;
    const download = await request(`/api/v1/loans/${reference}/documents/${created.id}/file`, { cookie });
    expect(download.status).toBe(200);
    expect(new Uint8Array(await download.arrayBuffer())).toEqual(PDF);
    expect(download.headers.get("content-type")).toBe("application/pdf");
    expect(download.headers.get("content-disposition")).toBe('attachment; filename="my passport.pdf"');
    expect(download.headers.get("cache-control")).toBe("private, no-store");
    expect(download.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("when documents may change", () => {
  test("uploading works for real documents all the way to a submit", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    await fillDraft(cookie, reference);
    for (const type of REQUIRED_DOCUMENTS) expect((await upload(cookie, reference, type, PDF)).status).toBe(201);
    const submitted = await postJson(`/api/v1/loans/${reference}/submit`, {}, { cookie });
    expect(submitted.status).toBe(200);
    expect((await json(submitted)).data.documents).toHaveLength(REQUIRED_DOCUMENTS.length);
  });

  test("a submitted application is closed to uploads and removals until staff ask for more", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);
    const doc = (await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data[0];

    const blockedUpload = await upload(cookie, reference, "other", PDF);
    expect(blockedUpload.status).toBe(409);
    expect((await json(blockedUpload)).error.code).toBe("LOAN_NOT_EDITABLE");
    expect((await request(`/api/v1/loans/${reference}/documents/${doc.id}`, { cookie, method: "DELETE" })).status).toBe(409);

    await patchJson(`/api/v1/admin/loans/${reference}/status`, { status: "documents_under_review" }, { cookie: staff.cookie });
    await patchJson(`/api/v1/admin/loans/${reference}/status`, { status: "additional_documents_required", note: "Please add a recent bank statement." }, { cookie: staff.cookie });
    expect((await upload(cookie, reference, "bank_statement", PDF)).status).toBe(201);
  });

  test("a removed document leaves storage too, and a verified one cannot be removed", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const created = (await json(await upload(cookie, reference, "passport", PDF))).data;
    const [row] = await db.select().from(loanDocuments).where(eq(loanDocuments.id, created.id));
    expect(await storage.get(row!.storageKey)).not.toBeNull();

    expect((await request(`/api/v1/loans/${reference}/documents/${created.id}`, { cookie, method: "DELETE" })).status).toBe(200);
    expect(await storage.get(row!.storageKey)).toBeNull();
    expect((await request(`/api/v1/loans/${reference}/documents/${created.id}/file`, { cookie })).status).toBe(404);

    const staff = await signInAdmin();
    const loan = await signInCustomer();
    const ref2 = await submittedLoan(loan.cookie);
    const docs = (await json(await request(`/api/v1/loans/${ref2}/documents`, { cookie: loan.cookie }))).data;
    await review(staff.cookie, ref2, docs[0].id, { verificationStatus: "verified" });
    await patchJson(`/api/v1/admin/loans/${ref2}/status`, { status: "documents_under_review" }, { cookie: staff.cookie });
    await patchJson(`/api/v1/admin/loans/${ref2}/status`, { status: "additional_documents_required", note: "One more document please." }, { cookie: staff.cookie });
    const blocked = await request(`/api/v1/loans/${ref2}/documents/${docs[0].id}`, { cookie: loan.cookie, method: "DELETE" });
    expect(blocked.status).toBe(409);
  });
});

describe("staff review", () => {
  test("staff verify, flag or reject documents, and the applicant sees the verdict and note", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);
    const docs = (await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data as { id: string; type: string }[];

    const verified = await review(staff.cookie, reference, docs[0]!.id, { verificationStatus: "verified" });
    expect(verified.status).toBe(200);
    expect((await json(verified)).data).toMatchObject({ verificationStatus: "verified", reviewNote: null });

    const flagged = await review(staff.cookie, reference, docs[1]!.id, { verificationStatus: "needs_review", note: "The photo is blurry." });
    expect((await json(flagged)).data).toMatchObject({ verificationStatus: "needs_review", reviewNote: "The photo is blurry." });

    const mine = (await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data as { id: string; verificationStatus: string; reviewNote: string | null }[];
    expect(mine.find((d) => d.id === docs[1]!.id)).toMatchObject({ verificationStatus: "needs_review", reviewNote: "The photo is blurry." });

    const [row] = await db.select().from(loanDocuments).where(eq(loanDocuments.id, docs[1]!.id));
    expect(row?.reviewedBy).toBe(staff.userId);
    expect(row?.reviewedAt).not.toBeNull();
  });

  test("a flag or rejection needs a note, a draft cannot be reviewed, and customers cannot review", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const reference = await submittedLoan(cookie);
    const doc = (await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data[0];

    expect((await review(staff.cookie, reference, doc.id, { verificationStatus: "rejected" })).status).toBe(422);
    expect((await review(staff.cookie, reference, doc.id, { verificationStatus: "needs_review" })).status).toBe(422);
    expect((await review(cookie, reference, doc.id, { verificationStatus: "verified" })).status).toBe(403);
    expect((await review(staff.cookie, reference, doc.id, { verificationStatus: "uploaded" })).status).toBe(422);
    expect((await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data.find((d: { id: string }) => d.id === doc.id).verificationStatus).toBe("uploaded");

    const draft = await createDraft(cookie);
    const draftDoc = (await json(await upload(cookie, draft.reference, "passport", PDF))).data;
    expect((await review(staff.cookie, draft.reference, draftDoc.id, { verificationStatus: "verified" })).status).toBe(409);
  });

  test("staff can download any applicant's document", async () => {
    const { cookie } = await signInCustomer();
    const staff = await signInAdmin();
    const { reference } = await createDraft(cookie);
    const created = (await json(await upload(cookie, reference, "passport", PNG, "id.png"))).data;
    const download = await request(`/api/v1/admin/loans/${reference}/documents/${created.id}/file`, { cookie: staff.cookie });
    expect(download.status).toBe(200);
    expect(new Uint8Array(await download.arrayBuffer())).toEqual(PNG);
    expect((await request(`/api/v1/admin/loans/${reference}/documents/${created.id}/file`, { cookie })).status).toBe(403);
  });
});
