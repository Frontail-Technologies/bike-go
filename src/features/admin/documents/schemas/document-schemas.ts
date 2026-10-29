import { z } from "zod";
import { adminError, adminT } from "@/features/admin/i18n/translate";

export const reviewSchema = z
  .object({
    verificationStatus: z.enum(["verified", "needs_review", "rejected"]),
    note: z.string().max(300, adminError("documents.validation.noteMax")),
  })
  .superRefine((value, context) => {
    if (value.verificationStatus !== "verified" && !value.note.trim()) context.addIssue({ code: "custom", path: ["note"], message: adminT("documents.validation.reason") });
    if (value.note.trim() && value.note.trim().length < 2) context.addIssue({ code: "custom", path: ["note"], message: adminT("documents.validation.noteMin") });
  });
export type ReviewValues = z.infer<typeof reviewSchema>;
