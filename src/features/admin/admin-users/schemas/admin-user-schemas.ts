import { z } from "zod";

const adminUserFields = z.object({
  name: z.string().trim().min(2, "Enter a full name."),
  email: z.email("Enter a valid email."),
  role: z.enum(["admin", "super_admin"]),
  password: z.string().min(10, "Use at least 10 characters."),
  confirmPassword: z.string(),
});

const passwordsMatch = { path: ["confirmPassword"], message: "Passwords do not match." };

export const adminUserSchema = adminUserFields.refine((value) => value.password === value.confirmPassword, passwordsMatch);
export const editAdminUserSchema = adminUserFields.pick({ name: true, role: true });
export const resetAdminPasswordSchema = adminUserFields.pick({ password: true, confirmPassword: true }).refine((value) => value.password === value.confirmPassword, passwordsMatch);
