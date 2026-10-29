import { z } from "zod";
import { adminError } from "@/features/admin/i18n/translate";

const adminUserFields = z.object({
  name: z.string().trim().min(2, adminError("authValidation.fullName")),
  email: z.email(adminError("authValidation.email")),
  role: z.enum(["admin", "super_admin"]),
  password: z.string().min(8, adminError("authValidation.minPassword")),
  confirmPassword: z.string(),
});

const passwordsMatch = { path: ["confirmPassword"], ...adminError("authValidation.mismatch") };

export const adminUserSchema = adminUserFields.refine((value) => value.password === value.confirmPassword, passwordsMatch);
export const editAdminUserSchema = adminUserFields.pick({ name: true, role: true });
export const resetAdminPasswordSchema = adminUserFields.pick({ password: true, confirmPassword: true }).refine((value) => value.password === value.confirmPassword, passwordsMatch);
