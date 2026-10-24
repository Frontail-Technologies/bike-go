import { z } from "zod";
import { rejectionReasons } from "../lib/loan-model";

const NOTE_LIMIT = 1000;
const note = z.string().max(NOTE_LIMIT, `Keep the note under ${NOTE_LIMIT} characters.`);
/** The backend requires at least 2 characters when a note is sent. */
const optionalNote = note.refine((value) => value.trim() === "" || value.trim().length >= 2, "Enter at least 2 characters, or leave it empty.");

export const statusUpdateSchema = z.object({ status: z.enum(["documents_under_review", "eligibility_review"]), note: optionalNote });
export type StatusUpdateValues = z.infer<typeof statusUpdateSchema>;

export const approveSchema = z.object({ note: optionalNote });
export type ApproveValues = z.infer<typeof approveSchema>;

export const rejectSchema = z.object({ reason: z.enum(rejectionReasons, "Choose a rejection reason."), note: optionalNote });
export type RejectValues = z.infer<typeof rejectSchema>;

export const requestDocumentsSchema = z.object({
  types: z.array(z.string()).min(1, "Select at least one document to request."),
  message: optionalNote,
});
export type RequestDocumentsValues = z.infer<typeof requestDocumentsSchema>;
