"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterDataApi } from "../api/master-data-api";
import { masterDataQueryKeys } from "../query-keys";
import type { MasterInput, MasterKind, MasterPageParams } from "../types/master-data";

export function useMasterDataQuery(kind: MasterKind, params: MasterPageParams) {
  return useQuery({ queryKey: masterDataQueryKeys.list(kind, params), queryFn: () => masterDataApi.list(kind, params), placeholderData: keepPreviousData });
}

export function useMasterDataMutations(kind: MasterKind) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: masterDataQueryKeys.all });
  return {
    create: useMutation({ mutationFn: (input: MasterInput) => masterDataApi.create(kind, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, ...input }: { id: string } & Partial<MasterInput>) => masterDataApi.update(kind, id, input), onSuccess: invalidate }),
    reorder: useMutation({ mutationFn: (ids: string[]) => masterDataApi.reorder(kind, ids), onSuccess: invalidate }),
    setImage: useMutation({ mutationFn: ({ id, image }: { id: string; image: File }) => masterDataApi.setImage(kind, id, image), onSuccess: invalidate }),
    removeImage: useMutation({ mutationFn: (id: string) => masterDataApi.removeImage(kind, id), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => masterDataApi.remove(kind, id), onSuccess: invalidate }),
  };
}
