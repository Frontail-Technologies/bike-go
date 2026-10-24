"use client";

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { bannersApi } from "../api/banners-api";
import { adminBannerQueryKeys } from "../query-keys";
import { placements, type Banner, type BannerCreateInput, type BannerListParams, type BannerPlacement, type BannerUpdateInput } from "../types/banner";

export function useBannersQuery(params: BannerListParams) {
  return useQuery({ queryKey: adminBannerQueryKeys.list(params), queryFn: () => bannersApi.list(params), placeholderData: keepPreviousData });
}

export function useBannerQuery(id: string) {
  return useQuery({ queryKey: adminBannerQueryKeys.detail(id), queryFn: () => bannersApi.get(id) });
}

/** Every banner of each placement, in display order, for the ordering view. */
export function usePlacementBannersQueries() {
  const results = useQueries({
    queries: placements.map((placement) => {
      const params: BannerListParams = { page: 1, pageSize: 100, placement, sort: "displayOrder" };
      return { queryKey: adminBannerQueryKeys.list(params), queryFn: () => bannersApi.list(params) };
    }),
  });
  return placements.map((placement, index) => ({ placement, query: results[index]! }));
}

export function useBannerMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: adminBannerQueryKeys.root() });
  return {
    create: useMutation({ mutationFn: (input: BannerCreateInput) => bannersApi.create(input), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, ...input }: { id: string } & BannerUpdateInput) => bannersApi.update(id, input), onSuccess: refresh }),
    setStatus: useMutation({ mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => bannersApi.update(id, { status }), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => bannersApi.remove(id), onSuccess: refresh }),
    duplicate: useMutation({ mutationFn: (banner: Banner) => bannersApi.duplicate(banner), onSuccess: refresh }),
    reorder: useMutation({ mutationFn: ({ placement, ids }: { placement: BannerPlacement; ids: string[] }) => bannersApi.reorder(placement, ids), onSettled: refresh }),
  };
}
