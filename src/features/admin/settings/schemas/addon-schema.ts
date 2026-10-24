import { z } from "zod";

export const addonSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(80, "Use at most 80 characters."),
  code: z.string().trim().regex(/^[A-Z0-9_]*$/, "Use upper-case letters, digits and underscores.").max(40, "Use at most 40 characters."),
  description: z.string().trim().max(300, "Use at most 300 characters."),
  price: z.string().trim().refine((value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0, "Enter a price greater than zero."),
  active: z.boolean(),
});

export type AddonValues = z.infer<typeof addonSchema>;
