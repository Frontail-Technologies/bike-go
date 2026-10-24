export type AdminRole = "admin" | "super_admin";
export type AdminStatus = "active" | "inactive";
export type AdminUser = { id: string; name: string; email: string; role: AdminRole; status: AdminStatus; mustChangePassword: boolean; lastLoginAt: string | null; createdAt: string };
export type AdminUsersMeta = { page: number; pageSize: number; total: number; totalPages: number };
export type AdminUsersParams = { page: number; pageSize: number; search?: string; role?: AdminRole; status?: AdminStatus; sortBy?: "name" | "email" | "role" | "status" | "lastLoginAt" | "createdAt"; sortOrder?: "asc" | "desc" };
