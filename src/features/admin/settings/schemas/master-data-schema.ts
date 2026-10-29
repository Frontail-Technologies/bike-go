import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";

export const masterDataSchema = z.object({
  name: z.string().trim().min(2, adminError("validation.minChars")).max(80, adminError("validation.maxChars", { max: 80 })),
  code: z.string().trim().regex(/^[a-z0-9_]*$/, adminError("settings.validation.lowerCode")).max(60, adminError("validation.maxChars", { max: 60 })),
  active: z.boolean(),
});

export type MasterDataValues = z.infer<typeof masterDataSchema>;
