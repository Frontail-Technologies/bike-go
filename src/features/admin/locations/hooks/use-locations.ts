"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "../api/locations-api";
import { adminLocationQueryKeys } from "../query-keys";
import type { LocationInput } from "../types/location";

/** The backend returns every location in one response, so search and paging happen over this list. */
export function useLocationsQuery() {
  return useQuery({ queryKey: adminLocationQueryKeys.list({}), queryFn: locationsApi.list, staleTime: 30_000 });
}

export function useLocationMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: adminLocationQueryKeys.root() });
  return {
    create: useMutation({ mutationFn: (input: LocationInput) => locationsApi.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, ...input }: { id: string } & Partial<LocationInput>) => locationsApi.update(id, input), onSuccess: invalidate }),
  };
}
