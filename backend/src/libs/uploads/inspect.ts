import { fileTypeFromBuffer } from "file-type";
import { AppError } from "@/libs/api";
import type { ErrorCode } from "@/libs/types";

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const DOCUMENT_FILE_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

export type UploadRules = {
  field: string;
  allowed: Record<string, string>;
  maxBytes: number;
  invalidCode: ErrorCode;
  invalidMessage: string;
};

export type InspectedUpload = { bytes: Uint8Array; contentType: string; extension: string; originalName: string };

const megabytes = (bytes: number) => `${bytes / 1024 / 1024} MB`;

export async function inspectUpload(file: File, rules: UploadRules): Promise<InspectedUpload> {
  if (file.size === 0) throw new AppError("VALIDATION_ERROR", 422, "That file is empty.", [{ path: rules.field, message: "Empty file." }]);
  if (file.size > rules.maxBytes) throw new AppError("FILE_TOO_LARGE", 413, `Files can be at most ${megabytes(rules.maxBytes)}.`, [{ path: rules.field, message: `Over ${megabytes(rules.maxBytes)}.` }]);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytes);
  const extension = detected ? rules.allowed[detected.mime] : undefined;
  if (!detected || !extension) throw new AppError(rules.invalidCode, 422, rules.invalidMessage, [{ path: rules.field, message: "Unsupported file content." }]);

  return { bytes, contentType: detected.mime, extension, originalName: file.name };
}

export const inspectImage = (file: File, field: string, maxBytes = MAX_IMAGE_BYTES) =>
  inspectUpload(file, { field, allowed: IMAGE_TYPES, maxBytes, invalidCode: "FILE_TYPE_INVALID", invalidMessage: "Only JPEG, PNG and WebP images are accepted." });

export const inspectDocument = (file: File, field = "file", maxBytes = MAX_DOCUMENT_BYTES) =>
  inspectUpload(file, { field, allowed: DOCUMENT_FILE_TYPES, maxBytes, invalidCode: "DOCUMENT_TYPE_INVALID", invalidMessage: "Only PDF, JPG and PNG files are accepted." });

export const asFileList = (value: File | File[] | undefined): File[] => (value === undefined ? [] : Array.isArray(value) ? value : [value]);
