import { z } from "zod";

export const reviewSchema = z
  .object({
    verificationStatus: z.enum(["verified", "needs_review", "rejected"]),
    note: z.string().max(300, "Keep the note under 300 characters."),
  })
  .superRefine((value, context) => {
    if (value.verificationStatus !== "verified" && !value.note.trim()) context.addIssue({ code: "custom", path: ["note"], message: "Add a reason so the applicant knows what to fix." });
    if (value.note.trim() && value.note.trim().length < 2) context.addIssue({ code: "custom", path: ["note"], message: "Enter at least 2 characters, or leave it empty." });
  });
export type ReviewValues = z.infer<typeof reviewSchema>;
