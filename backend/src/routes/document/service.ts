import { and, count, eq } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { loanApplications, loanDocuments } from "@/libs/db/schema";
import { storage } from "@/providers/storage";
import { findOwned } from "@/routes/loan/service";
import { DOCUMENT_TYPES } from "@/routes/loan/rules";
import type { DocumentType } from "@/routes/loan/types";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PER_TYPE = 5;
const MAX_PER_APPLICATION = 20;

const ALLOWED: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

const OPEN_FOR_DOCUMENTS = ["draft", "additional_documents_required"] as const;

export function sanitizeFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/\p{Cc}/gu, "")
    .replace(/[^\w.\- ()]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120);
  return cleaned || "document";
}

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

export async function uploadDocument(userId: string, reference: string, input: { type: string; file: File }) {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(input.type)) {
    throw new AppError("DOCUMENT_TYPE_INVALID", 422, `Unknown document type. Use one of: ${DOCUMENT_TYPES.join(", ")}.`);
  }
  const type = input.type as DocumentType;

  const application = await findOwned(db, userId, reference);
  if (!(OPEN_FOR_DOCUMENTS as readonly string[]).includes(application.status)) {
    throw new AppError("LOAN_NOT_EDITABLE", 409, "Documents can only be added while the application is a draft or when staff have asked for more.");
  }

  if (input.file.size === 0) throw new AppError("VALIDATION_ERROR", 422, "That file is empty.", [{ path: "file", message: "Empty file." }]);
  if (input.file.size > MAX_FILE_BYTES) throw new AppError("FILE_TOO_LARGE", 413, `Files can be at most ${MAX_FILE_BYTES / 1024 / 1024} MB.`);

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytes);
  const extension = detected ? ALLOWED[detected.mime] : undefined;
  if (!detected || !extension) throw new AppError("DOCUMENT_TYPE_INVALID", 422, "Only PDF, JPG and PNG files are accepted.");

  const [totals, [sameType]] = await Promise.all([
    db.select({ n: count() }).from(loanDocuments).where(eq(loanDocuments.applicationId, application.id)),
    db.select({ n: count() }).from(loanDocuments).where(and(eq(loanDocuments.applicationId, application.id), eq(loanDocuments.type, type))),
  ]);
  if ((totals[0]?.n ?? 0) >= MAX_PER_APPLICATION) throw new AppError("VALIDATION_ERROR", 422, `An application can have at most ${MAX_PER_APPLICATION} documents.`);
  if ((sameType?.n ?? 0) >= MAX_PER_TYPE) throw new AppError("VALIDATION_ERROR", 422, `At most ${MAX_PER_TYPE} files per document type. Remove one first.`);

  const storageKey = `loans/${application.id}/${crypto.randomUUID()}.${extension}`;
  await storage.put(storageKey, bytes, { contentType: detected.mime });
  try {
    const [created] = await db
      .insert(loanDocuments)
      .values({ applicationId: application.id, type, storageKey, originalFilename: sanitizeFilename(input.file.name), mimeType: detected.mime, sizeBytes: bytes.byteLength })
      .returning();
    return view(created!);
  } catch (error) {
    await storage.delete(storageKey);
    throw error;
  }
}

export async function deleteDocument(userId: string, reference: string, documentId: string) {
  const application = await findOwned(db, userId, reference);
  if (!(OPEN_FOR_DOCUMENTS as readonly string[]).includes(application.status)) {
    throw new AppError("LOAN_NOT_EDITABLE", 409, "Documents can only be removed while the application is a draft or when staff have asked for more.");
  }
  const [doc] = await db.select().from(loanDocuments).where(and(eq(loanDocuments.id, documentId), eq(loanDocuments.applicationId, application.id))).limit(1);
  if (!doc) throw new AppError("NOT_FOUND", 404, "Document not found.");
  if (doc.verificationStatus === "verified") throw new AppError("LOAN_NOT_EDITABLE", 409, "A verified document cannot be removed.");
  await db.delete(loanDocuments).where(eq(loanDocuments.id, doc.id));
  await storage.delete(doc.storageKey);
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
