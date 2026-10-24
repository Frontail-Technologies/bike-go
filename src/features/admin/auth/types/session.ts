export type AdminSession = { id: string; name: string; email: string; role: "admin" | "super_admin"; status: "active" | "inactive"; mustChangePassword: boolean };
