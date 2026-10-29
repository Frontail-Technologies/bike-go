"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import type { AdminUsersParams } from "../types/admin-user";

const roles = ["admin", "super_admin"] as const;
const statuses = ["active", "inactive"] as const;
const sorts = ["name", "email", "role", "status", "lastLoginAt", "createdAt"] as const;
const read = (search: URLSearchParams): AdminUsersParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: 20,
  search: search.get("search")?.trim() || undefined, role: oneOf(roles, search.get("role")), status: oneOf(statuses, search.get("status")),
  sortBy: oneOf(sorts, search.get("sortBy")) ?? "createdAt", sortOrder: oneOf(["asc", "desc"] as const, search.get("sortOrder")) ?? "desc",
});
const reset = { search: undefined, role: undefined, status: undefined, sortBy: "createdAt" as const, sortOrder: "desc" as const };

export function useAdminUsersListState() {
  return useListState<AdminUsersParams>({
    pathname: "/admin/admins",
    read,
    reset,
  });
}
