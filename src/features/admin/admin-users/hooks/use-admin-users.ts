"use client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi } from "../api/admin-users-api";
import { adminUserQueryKeys } from "../query-keys";
import type { AdminUsersParams } from "../types/admin-user";
export function useAdminUsersQuery(params: AdminUsersParams) { return useQuery({ queryKey: adminUserQueryKeys.list(params), queryFn: () => adminUsersApi.list(params), placeholderData: keepPreviousData }); }
export function useAdminUserMutations() { const client=useQueryClient(); const invalidate=()=>client.invalidateQueries({queryKey:adminUserQueryKeys.lists()}); return { create:useMutation({mutationFn:adminUsersApi.create,onSuccess:invalidate}), update:useMutation({mutationFn:({id,...input}:{id:string;name:string;role:"admin"|"super_admin"})=>adminUsersApi.update(id,input),onSuccess:invalidate}), activate:useMutation({mutationFn:adminUsersApi.activate,onSuccess:invalidate}), deactivate:useMutation({mutationFn:adminUsersApi.deactivate,onSuccess:invalidate}), reset:useMutation({mutationFn:({id,password}:{id:string;password:string})=>adminUsersApi.resetPassword(id,password),onSuccess:invalidate}) }; }
