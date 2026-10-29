import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";

export const refundFormSchema = z.object({
  amount: z
    .string()
    .min(1, adminError("payments.validation.amount"))
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, adminError("payments.validation.positive"))
    .refine((value) => Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 1e-6, adminError("payments.validation.decimals")),
  reason: z.string().trim().min(2, adminError("payments.validation.reasonMin")).max(300, adminError("payments.validation.reasonMax")),
});
export type RefundFormValues = z.infer<typeof refundFormSchema>;
