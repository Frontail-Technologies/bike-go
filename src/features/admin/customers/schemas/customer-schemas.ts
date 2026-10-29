import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";

const optional = (schema: z.ZodString) => z.union([z.literal(""), schema]);

export const customerEditSchema = z.object({
  fullName: z.string().trim().min(2, adminError("validation.minChars")).max(120),
  phone: optional(z.string().trim().min(6, adminError("validation.phone")).max(24, adminError("validation.phone"))),
  email: optional(z.string().trim().email(adminError("validation.email")).max(160)),
  dateOfBirth: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, adminError("validation.date"))),
  nationality: optional(z.string().trim().min(2, adminError("validation.minChars")).max(80)),
  city: optional(z.string().trim().min(2, adminError("validation.minChars")).max(80)),
  address: z.string().trim().max(300, adminError("validation.maxChars", { max: 300 })),
});
export type CustomerEditValues = z.infer<typeof customerEditSchema>;
