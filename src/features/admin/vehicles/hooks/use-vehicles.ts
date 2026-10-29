"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "../api/vehicles-api";
import { adminBookingQueryKeys } from "@/features/admin/bookings/query-keys";
import { adminVehicleQueryKeys } from "../query-keys";
import type { VehicleBlockInput, VehicleCreateInput, VehicleListParams, VehicleUpdateInput } from "../types/vehicle";

export function useVehiclesQuery(params: VehicleListParams) {
  return useQuery({
    queryKey: adminVehicleQueryKeys.list({ ...params }),
    queryFn: () => vehiclesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useVehicleQuery(id: string) {
  return useQuery({ queryKey: adminVehicleQueryKeys.detail(id), queryFn: () => vehiclesApi.get(id) });
}

export function useVehicleMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: adminVehicleQueryKeys.root() });
  return {
    create: useMutation({ mutationFn: (input: VehicleCreateInput) => vehiclesApi.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, ...input }: { id: string } & VehicleUpdateInput) => vehiclesApi.update(id, input), onSuccess: invalidate }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: "available" | "inactive" | "maintenance" }) => vehiclesApi.update(id, { status }),
      onSuccess: () => Promise.all([invalidate(), client.invalidateQueries({ queryKey: adminBookingQueryKeys.root() })]),
    }),
  };
}

export function useVehicleBlocksQuery(id: string) {
  return useQuery({ queryKey: adminVehicleQueryKeys.availability(id), queryFn: () => vehiclesApi.blocks(id) });
}

export function useVehicleBlockMutations(id: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: adminVehicleQueryKeys.availability(id) });
  return {
    add: useMutation({ mutationFn: (input: VehicleBlockInput) => vehiclesApi.addBlock(id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (blockId: string) => vehiclesApi.removeBlock(id, blockId), onSuccess: invalidate }),
  };
}
