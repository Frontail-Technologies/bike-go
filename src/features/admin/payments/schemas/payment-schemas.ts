import { z } from "zod";

export const refundFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter the amount to refund.")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Enter an amount greater than zero.")
    .refine((value) => Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 1e-6, "Use at most two decimal places."),
  reason: z.string().trim().min(2, "Enter a reason (at least 2 characters).").max(300, "Keep the reason under 300 characters."),
});
export type RefundFormValues = z.infer<typeof refundFormSchema>;
