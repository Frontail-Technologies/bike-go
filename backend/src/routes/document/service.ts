import { and, count, eq } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { loanApplications, loanDocuments } from "@/libs/db/schema";
import { sanitizeFilename } from "@/libs/uploads/filenames";
import { inspectDocument, MAX_DOCUMENT_BYTES } from "@/libs/uploads/inspect";
import { commitOrDiscard, discardQuietly, uploadAll } from "@/libs/uploads/storage";
import { storage } from "@/providers/storage";
import { findOwned } from "@/routes/loan/service";
import { DOCUMENT_TYPES } from "@/routes/loan/rules";
import type { DocumentType } from "@/routes/loan/types";

export const MAX_FILE_BYTES = MAX_DOCUMENT_BYTES;
const MAX_PER_TYPE = 5;
const MAX_PER_APPLICATION = 20;

const OPEN_FOR_DOCUMENTS = ["draft", "additional_documents_required"] as const;

export { sanitizeFilename };

const view = (d: typeof loanDocuments.$inferSelect) => ({
  id: d.id,
  type: d.type,
  originalFilename: d.originalFilename,
  mimeType: d.mimeType,
  sizeBytes: d.sizeBytes,
  verificationStatus: d.verificationStatus,
  reviewNote: d.reviewNote,
  uploadedAt: d.uploadedAt.toISOString(),
});

export async function listDocuments(userId: string, reference: string) {
  const application = await findOwned(db, userId, reference);
  const rows = await db.select().from(loanDocuments).where(eq(loanDocuments.applicationId, application.id)).orderBy(loanDocuments.uploadedAt);
  return rows.map(view);
}

function documentType(value: string) {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(value)) {
    throw new AppError("DOCUMENT_TYPE_INVALID", 422, `Unknown document type. Use one of: ${DOCUMENT_TYPES.join(", ")}.`);
  }
  return value as DocumentType;
}

function assertOpen(status: string, message: string) {
  if (!(OPEN_FOR_DOCUMENTS as readonly string[]).includes(status)) throw new AppError("LOAN_NOT_EDITABLE", 409, message);
}

const documentKey = (applicationId: string, extension: string) => `loans/${applicationId}/${crypto.randomUUID()}.${extension}`;

async function assertRoomForType(applicationId: string, type: DocumentType, options: { adding: boolean }) {
  const [totals, [sameType]] = await Promise.all([
    db.select({ n: count() }).from(loanDocuments).where(eq(loanDocuments.applicationId, applicationId)),
    db.select({ n: count() }).from(loanDocuments).where(and(eq(loanDocuments.applicationId, applicationId), eq(loanDocuments.type, type))),
  ]);
  if (options.adding && (totals[0]?.n ?? 0) >= MAX_PER_APPLICATION) throw new AppError("VALIDATION_ERROR", 422, `An application can have at most ${MAX_PER_APPLICATION} documents.`);
  if ((sameType?.n ?? 0) >= MAX_PER_TYPE) throw new AppError("VALIDATION_ERROR", 422, `At most ${MAX_PER_TYPE} files per document type. Remove one first.`);
}

export async function uploadDocument(userId: string, reference: string, input: { type: string; file: File }) {
  const type = documentType(input.type);

  const application = await findOwned(db, userId, reference);
  assertOpen(application.status, "Documents can only be added while the application is a draft or when staff have asked for more.");

  const upload = await inspectDocument(input.file);
  await assertRoomForType(application.id, type, { adding: true });

  const storageKey = documentKey(application.id, upload.extension);
  await uploadAll([{ key: storageKey, upload }]);
  const created = await commitOrDiscard([storageKey], async () => {
    const [row] = await db
      .insert(loanDocuments)
      .values({ applicationId: application.id, type, storageKey, originalFilename: sanitizeFilename(upload.originalName), mimeType: upload.contentType, sizeBytes: upload.bytes.byteLength })
      .returning();
    return row!;
  });
  return view(created);
}

export async function replaceDocument(userId: string, reference: string, documentId: string, input: { type?: string | undefined; file?: File | undefined }) {
  if (input.type === undefined && input.file === undefined) throw new AppError("VALIDATION_ERROR", 422, "Send a replacement file, a new document type, or both.");
  const type = input.type === undefined ? undefined : documentType(input.type);

  const application = await findOwned(db, userId, reference);
  assertOpen(application.status, "Documents can only be replaced while the application is a draft or when staff have asked for more.");
  const [doc] = await db.select().from(loanDocuments).where(and(eq(loanDocuments.id, documentId), eq(loanDocuments.applicationId, application.id))).limit(1);
  if (!doc) throw new AppError("NOT_FOUND", 404, "Document not found.");
  if (doc.verificationStatus === "verified") throw new AppError("LOAN_NOT_EDITABLE", 409, "A verified document cannot be replaced.");

  const upload = input.file ? await inspectDocument(input.file) : undefined;
  if (type && type !== doc.type) await assertRoomForType(application.id, type, { adding: false });

  const storageKey = upload ? documentKey(application.id, upload.extension) : undefined;
  if (upload && storageKey) await uploadAll([{ key: storageKey, upload }]);
  const updated = await commitOrDiscard(storageKey ? [storageKey] : [], async () => {
    const [row] = await db
      .update(loanDocuments)
      .set({
        ...(type ? { type } : {}),
        ...(upload && storageKey ? { storageKey, originalFilename: sanitizeFilename(upload.originalName), mimeType: upload.contentType, sizeBytes: upload.bytes.byteLength, uploadedAt: new Date() } : {}),
        verificationStatus: "uploaded",
        reviewNote: null,
        reviewedAt: null,
        reviewedBy: null,
      })
      .where(eq(loanDocuments.id, doc.id))
      .returning();
    return row!;
  });
  if (storageKey) await discardQuietly([doc.storageKey]);
  return view(updated);
}

export async function deleteDocument(userId: string, reference: string, documentId: string) {
  const application = await findOwned(db, userId, reference);
  assertOpen(application.status, "Documents can only be removed while the application is a draft or when staff have asked for more.");
  const [doc] = await db.select().from(loanDocuments).where(and(eq(loanDocuments.id, documentId), eq(loanDocuments.applicationId, application.id))).limit(1);
  if (!doc) throw new AppError("NOT_FOUND", 404, "Document not found.");
  if (doc.verificationStatus === "verified") throw new AppError("LOAN_NOT_EDITABLE", 409, "A verified document cannot be removed.");
  await db.delete(loanDocuments).where(eq(loanDocuments.id, doc.id));
  await discardQuietly([doc.storageKey]);
  return { id: doc.id };
}

async function readFile(doc: typeof loanDocuments.$inferSelect) {
  const bytes = await storage.get(doc.storageKey);
  if (!bytes) throw new AppError("NOT_FOUND", 404, "The file is no longer available.");
  const headers = {
    "content-type": doc.mimeType,
    "content-disposition": `attachment; filename="${sanitizeFilename(doc.originalFilename).replaceAll('"', "")}"`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };
  return new Response(bytes as BodyInit, { headers });
}

export async function downloadOwnDocument(userId: string, reference: string, documentId: string) {
  const application = await findOwned(db, userId, reference);
  const [doc] = await db.select().from(loanDocuments).where(and(eq(loanDocuments.id, documentId), eq(loanDocuments.applicationId, application.id))).limit(1);
  if (!doc) throw new AppError("NOT_FOUND", 404, "Document not found.");
  return readFile(doc);
}

export async function downloadAnyDocument(reference: string, documentId: string) {
  const [row] = await db
    .select({ doc: loanDocuments })
    .from(loanDocuments)
    .innerJoin(loanApplications, eq(loanApplications.id, loanDocuments.applicationId))
    .where(and(eq(loanDocuments.id, documentId), eq(loanApplications.reference, reference)))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Document not found.");
  return readFile(row.doc);
}

export async function reviewDocument(reference: string, staffUserId: string, documentId: string, input: { verificationStatus: "verified" | "needs_review" | "rejected"; note?: string | undefined }) {
  if ((input.verificationStatus === "needs_review" || input.verificationStatus === "rejected") && !input.note?.trim()) {
    throw new AppError("VALIDATION_ERROR", 422, "A note is required when a document needs review or is rejected.", [{ path: "note", message: "Required for this status." }]);
  }
  const [row] = await db
    .select({ doc: loanDocuments, status: loanApplications.status })
    .from(loanDocuments)
    .innerJoin(loanApplications, eq(loanApplications.id, loanDocuments.applicationId))
    .where(and(eq(loanDocuments.id, documentId), eq(loanApplications.reference, reference)))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Document not found.");
  if (row.status === "draft") throw new AppError("INVALID_LOAN_STATUS_TRANSITION", 409, "Documents on a draft application cannot be reviewed yet.");

  const [updated] = await db
    .update(loanDocuments)
    .set({ verificationStatus: input.verificationStatus, reviewNote: input.note?.trim() ?? null, reviewedAt: new Date(), reviewedBy: staffUserId })
    .where(eq(loanDocuments.id, documentId))
    .returning();
  return view(updated!);
}
