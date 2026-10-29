import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";

export const addonSchema = z.object({
  name: z.string().trim().min(2, adminError("validation.minChars")).max(80, adminError("validation.maxChars", { max: 80 })),
  code: z.string().trim().regex(/^[A-Z0-9_]*$/, adminError("settings.validation.upperCode")).max(40, adminError("validation.maxChars", { max: 40 })),
  description: z.string().trim().max(300, adminError("validation.maxChars", { max: 300 })),
  price: z.string().trim().refine((value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0, adminError("settings.validation.price")),
  active: z.boolean(),
});

export type AddonValues = z.infer<typeof addonSchema>;
