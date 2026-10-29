import { z } from "zod";

const optional = (schema: z.ZodString) => z.union([z.literal(""), schema]);

export const customerEditSchema = z.object({
  fullName: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  phone: optional(z.string().trim().min(6, "Enter a valid phone number.").max(24, "Enter a valid phone number.")),
  email: optional(z.string().trim().email("Enter a valid email address.").max(160)),
  dateOfBirth: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")),
  nationality: optional(z.string().trim().min(2, "Enter at least 2 characters.").max(80)),
  city: optional(z.string().trim().min(2, "Enter at least 2 characters.").max(80)),
  address: z.string().trim().max(300, "Use at most 300 characters."),
});
export type CustomerEditValues = z.infer<typeof customerEditSchema>;
