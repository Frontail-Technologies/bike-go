import { z } from "zod";

export const masterDataSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(80, "Use at most 80 characters."),
  code: z.string().trim().regex(/^[a-z0-9_]*$/, "Use lower-case letters, digits and underscores.").max(60, "Use at most 60 characters."),
  active: z.boolean(),
});

export type MasterDataValues = z.infer<typeof masterDataSchema>;
