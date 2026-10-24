import { z } from "zod";
export const adminUserSchema = z.object({ name: z.string().trim().min(2, "Enter a full name."), email: z.email("Enter a valid email."), role: z.enum(["admin", "super_admin"]), password: z.string().min(10, "Use at least 10 characters."), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export const editAdminUserSchema = adminUserSchema.pick({ name: true, role: true });
export const resetAdminPasswordSchema = adminUserSchema.pick({ password: true, confirmPassword: true }).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
