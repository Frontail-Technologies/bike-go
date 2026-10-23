import { describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { loanApplications, loanDocuments } from "../src/libs/db/schema";
import { storage } from "../src/providers/storage";
import { json } from "./helpers/http";
import { request, signInCustomer } from "./helpers/auth";
import { asFile, EXE, formOf, jpeg, PDF, png, storedBytes, storedKeys } from "./helpers/files";
import { createDraft } from "./helpers/loan";

const send = (cookie: string | undefined, method: "POST" | "PATCH", path: string, fields: Record<string, string | File | undefined>) =>
  request(path, { method, body: formOf(fields), ...(cookie ? { cookie } : {}) });

const upload = async (cookie: string, reference: string, type: string, bytes: Uint8Array, name: string, extra: Record<string, string> = {}) => {
  const response = await send(cookie, "POST", `/api/v1/loans/${reference}/documents`, { type, file: asFile(bytes, name), ...extra });
  expect(response.status).toBe(201);
  return (await json(response)).data as { id: string; type: string; mimeType: string; verificationStatus: string };
};

const replace = (cookie: string | undefined, reference: string, id: string, fields: Record<string, string | File | undefined>) => send(cookie, "PATCH", `/api/v1/loans/${reference}/documents/${id}`, fields);
const rowOf = async (id: string) => (await db.select().from(loanDocuments).where(eq(loanDocuments.id, id)))[0]!;

describe("uploading directly to the document route", () => {
  test("the file goes in the same request, and a client-supplied storage key is ignored", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const doc = await upload(cookie, reference, "passport", PDF, "passport.pdf", { storageKey: "loans/evil/stolen.pdf", url: "https://example.com/x.pdf" });
    const row = await rowOf(doc.id);
    expect(row.storageKey).toMatch(/^loans\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/);
    expect(row.storageKey).not.toContain("evil");
    expect(storedBytes(row.storageKey)).toEqual(PDF);
  });

  test("JPEG and PNG documents are accepted and nothing internal is returned", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const a = await upload(cookie, reference, "address_proof", jpeg(), "bill.jpg");
    const b = await upload(cookie, reference, "bank_statement", png(), "statement.png");
    expect([a.mimeType, b.mimeType]).toEqual(["image/jpeg", "image/png"]);
    const listed = await (await request(`/api/v1/loans/${reference}/documents`, { cookie })).text();
    for (const key of storedKeys("loans/")) expect(listed).not.toContain(key);
    expect(listed).not.toContain("storageKey");
    expect(listed).not.toContain("storage_key");
  });

  test("a database failure after the upload removes the new file", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const before = storedKeys("loans/").length;
    const spy = spyOn(db, "insert").mockImplementationOnce(() => {
      throw new Error("database is down");
    });
    try {
      expect((await send(cookie, "POST", `/api/v1/loans/${reference}/documents`, { type: "passport", file: asFile(PDF, "p.pdf") })).status).toBe(500);
    } finally {
      spy.mockRestore();
    }
    expect(storedKeys("loans/").length).toBe(before);
  });

  test("a storage failure creates no document", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const spy = spyOn(storage, "put").mockRejectedValue(new Error("storage is down"));
    try {
      const response = await send(cookie, "POST", `/api/v1/loans/${reference}/documents`, { type: "passport", file: asFile(PDF, "p.pdf") });
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("storage is down");
    } finally {
      spy.mockRestore();
    }
    const listed = (await json(await request(`/api/v1/loans/${reference}/documents`, { cookie }))).data;
    expect(listed).toEqual([]);
  });
});

describe("replacing a document", () => {
  test("the new file takes over, the old one is removed after the change is saved, and review starts again", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const doc = await upload(cookie, reference, "passport", PDF, "old.pdf");
    const oldKey = (await rowOf(doc.id)).storageKey;
    await db.update(loanDocuments).set({ verificationStatus: "rejected", reviewNote: "Blurry", reviewedAt: new Date() }).where(eq(loanDocuments.id, doc.id));
    await db.update(loanApplications).set({ status: "additional_documents_required" }).where(eq(loanApplications.reference, reference));

    const fresh = png();
    const response = await replace(cookie, reference, doc.id, { file: asFile(fresh, "new.png") });
    expect(response.status).toBe(200);
    const body = (await json(response)).data;
    expect(body).toMatchObject({ id: doc.id, type: "passport", mimeType: "image/png", originalFilename: "new.png", sizeBytes: fresh.byteLength, verificationStatus: "uploaded", reviewNote: null });

    const row = await rowOf(doc.id);
    expect(row.storageKey).not.toBe(oldKey);
    expect(storedBytes(row.storageKey)).toEqual(fresh);
    expect(storedBytes(oldKey)).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(row.storageKey);
  });

  test("the type alone can be corrected, and a file can come with a new type", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const doc = await upload(cookie, reference, "other", PDF, "scan.pdf");
    const key = (await rowOf(doc.id)).storageKey;

    const typeOnly = await replace(cookie, reference, doc.id, { type: "address_proof" });
    expect((await json(typeOnly)).data).toMatchObject({ type: "address_proof", mimeType: "application/pdf" });
    expect((await rowOf(doc.id)).storageKey).toBe(key);

    const both = await replace(cookie, reference, doc.id, { type: "bank_statement", file: asFile(jpeg(), "s.jpg") });
    expect((await json(both)).data).toMatchObject({ type: "bank_statement", mimeType: "image/jpeg" });
    expect((await replace(cookie, reference, doc.id, { type: "not_a_type" })).status).toBe(422);
  });

  test("an invalid replacement is refused and the old file stays", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const doc = await upload(cookie, reference, "passport", PDF, "old.pdf");
    const before = await rowOf(doc.id);
    const keys = storedKeys("loans/").sort();

    const exe = await replace(cookie, reference, doc.id, { file: asFile(EXE, "scan.pdf", "application/pdf") });
    expect(exe.status).toBe(422);
    expect((await json(exe)).error.code).toBe("DOCUMENT_TYPE_INVALID");
    const big = await replace(cookie, reference, doc.id, { file: asFile(new Uint8Array(5 * 1024 * 1024 + 1).fill(1), "big.pdf", "application/pdf") });
    expect(big.status).toBe(413);
    expect((await replace(cookie, reference, doc.id, {})).status).toBe(422);

    expect(storedKeys("loans/").sort()).toEqual(keys);
    expect((await rowOf(doc.id)).storageKey).toBe(before.storageKey);
  });

  test("a database failure keeps the old file and removes the new one", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const doc = await upload(cookie, reference, "passport", PDF, "old.pdf");
    const before = await rowOf(doc.id);
    const keys = storedKeys("loans/").sort();

    const spy = spyOn(db, "update").mockImplementationOnce(() => {
      throw new Error("database is down");
    });
    try {
      expect((await replace(cookie, reference, doc.id, { file: asFile(png(), "new.png") })).status).toBe(500);
    } finally {
      spy.mockRestore();
    }
    expect(storedKeys("loans/").sort()).toEqual(keys);
    expect(storedBytes(before.storageKey)).toEqual(PDF);
    expect((await rowOf(doc.id)).storageKey).toBe(before.storageKey);
  });

  test("a storage failure keeps the old file and the old record", async () => {
    const { cookie } = await signInCustomer();
    const { reference } = await createDraft(cookie);
    const doc = await upload(cookie, reference, "passport", PDF, "old.pdf");
    const before = await rowOf(doc.id);
    const spy = spyOn(storage, "put").mockRejectedValue(new Error("storage is down"));
    try {
      expect((await replace(cookie, reference, doc.id, { file: asFile(png(), "new.png") })).status).toBe(500);
    } finally {
      spy.mockRestore();
    }
    expect(storedBytes(before.storageKey)).toEqual(PDF);
    expect((await rowOf(doc.id)).originalFilename).toBe("old.pdf");
  });

  test("only the owner can replace, a verified document cannot be replaced, and a submitted application is closed", async () => {
    const owner = await signInCustomer();
    const stranger = await signInCustomer();
    const { reference } = await createDraft(owner.cookie);
    const doc = await upload(owner.cookie, reference, "passport", PDF, "old.pdf");
    const keys = storedKeys("loans/").sort();

    expect((await replace(undefined, reference, doc.id, { file: asFile(png(), "n.png") })).status).toBe(401);
    expect((await replace(stranger.cookie, reference, doc.id, { file: asFile(png(), "n.png") })).status).toBe(404);
    expect((await replace(owner.cookie, reference, crypto.randomUUID(), { file: asFile(png(), "n.png") })).status).toBe(404);

    await db.update(loanDocuments).set({ verificationStatus: "verified" }).where(eq(loanDocuments.id, doc.id));
    const verified = await replace(owner.cookie, reference, doc.id, { file: asFile(png(), "n.png") });
    expect(verified.status).toBe(409);
    await db.update(loanDocuments).set({ verificationStatus: "uploaded" }).where(eq(loanDocuments.id, doc.id));

    await db.update(loanApplications).set({ status: "submitted" }).where(eq(loanApplications.reference, reference));
    const closed = await replace(owner.cookie, reference, doc.id, { file: asFile(png(), "n.png") });
    expect(closed.status).toBe(409);
    expect((await json(closed)).error.code).toBe("LOAN_NOT_EDITABLE");

    expect(storedKeys("loans/").sort()).toEqual(keys);
  });
});
