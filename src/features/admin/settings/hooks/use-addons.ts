"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addonsApi } from "../api/addons-api";
import { addonQueryKeys } from "../query-keys";
import type { AddonCreateInput, AddonUpdateInput } from "../types/addon";

export const useAddonsQuery = () => useQuery({ queryKey: addonQueryKeys.list(), queryFn: addonsApi.list });
export const useAddonsPageQuery = (params: { page: number; pageSize: number; q?: string; active?: boolean }) => useQuery({ queryKey: addonQueryKeys.list(params), queryFn: () => addonsApi.page(params), placeholderData: (previous) => previous });

export function useAddonMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: addonQueryKeys.all });
  return {
    create: useMutation({ mutationFn: (input: AddonCreateInput) => addonsApi.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, ...input }: { id: string } & AddonUpdateInput) => addonsApi.update(id, input), onSuccess: invalidate }),
  };
}
