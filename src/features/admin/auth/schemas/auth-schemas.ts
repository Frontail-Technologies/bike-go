import { z } from "zod";
export const adminLoginSchema = z.object({ email: z.email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });
export const adminPasswordSchema = z.object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: z.string().min(10, "Use at least 10 characters."), confirmPassword: z.string() }).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
