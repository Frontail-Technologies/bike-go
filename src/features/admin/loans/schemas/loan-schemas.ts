import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";
import { rejectionReasons } from "../lib/loan-model";

const NOTE_LIMIT = 1000;
const note = z.string().max(NOTE_LIMIT, adminError("loans.validation.noteMax", { max: NOTE_LIMIT }));
const optionalNote = note.refine((value) => value.trim() === "" || value.trim().length >= 2, adminError("loans.validation.noteMin"));

export const statusUpdateSchema = z.object({ status: z.enum(["documents_under_review", "eligibility_review"]), note: optionalNote });
export type StatusUpdateValues = z.infer<typeof statusUpdateSchema>;

export const approveSchema = z.object({ note: optionalNote });
export type ApproveValues = z.infer<typeof approveSchema>;

export const rejectSchema = z.object({ reason: z.enum(rejectionReasons, adminError("loans.validation.reason")), note: optionalNote });
export type RejectValues = z.infer<typeof rejectSchema>;

export const requestDocumentsSchema = z.object({
  types: z.array(z.string()).min(1, adminError("loans.validation.documents")),
  message: optionalNote,
});
export type RequestDocumentsValues = z.infer<typeof requestDocumentsSchema>;
