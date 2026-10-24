import type { AdminUsersParams } from "./types/admin-user";
export const adminUserQueryKeys = { all: ["admin", "users"] as const, lists: () => [...adminUserQueryKeys.all, "list"] as const, list: (params: AdminUsersParams) => [...adminUserQueryKeys.lists(), params] as const };
