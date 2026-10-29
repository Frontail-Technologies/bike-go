import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";
export const adminLoginSchema = z.object({ email: z.email(adminError("authValidation.emailAddress")), password: z.string().min(1, adminError("authValidation.password")) });
export const adminPasswordSchema = z.object({ currentPassword: z.string().min(1, adminError("authValidation.currentPassword")), newPassword: z.string().min(8, adminError("authValidation.minPassword")), confirmPassword: z.string() }).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], ...adminError("authValidation.mismatch") });
