"use client";
import { keepPreviousData,useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { masterDataApi } from "../api/master-data-api";
import { masterDataQueryKeys } from "../query-keys";
import type { MasterKind,MasterPageParams } from "../types/master-data";
export function useMasterDataQuery(kind:MasterKind,params:MasterPageParams){return useQuery({queryKey:masterDataQueryKeys.list(kind,params),queryFn:()=>masterDataApi.list(kind,params),placeholderData:keepPreviousData});}
export function useMasterDataMutations(kind:MasterKind){const c=useQueryClient();const invalidate=()=>c.invalidateQueries({queryKey:masterDataQueryKeys.all});return{create:useMutation({mutationFn:(input:{name:string;code?:string;active?:boolean})=>masterDataApi.create(kind,input),onSuccess:invalidate}),update:useMutation({mutationFn:({id,...input}:{id:string;name?:string;code?:string;active?:boolean})=>masterDataApi.update(kind,id,input),onSuccess:invalidate}),reorder:useMutation({mutationFn:(ids:string[])=>masterDataApi.reorder(kind,ids),onSuccess:invalidate})};}
