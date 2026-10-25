"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { BikeDetailsSkeleton } from "./bike-details-skeleton";
import { useVehicleQuery } from "@/features/customer/vehicles/hooks/generated";
import { vehicleToMotorcycle } from "@/features/customer/vehicles/lib/vehicle-mapper";
import { BikeDetailsView } from "./bike-details-view";
import { MotorcycleIcon } from "@phosphor-icons/react";

export function BikeDetailsRoute({ id }: { id: string }) {
  const vehicle = useVehicleQuery(id);
  if (vehicle.isPending) return <BikeDetailsSkeleton />;
  if (vehicle.isError || !vehicle.data) {
    return <main className="mx-auto flex min-h-[60dvh] max-w-lg items-center px-page"><EmptyState icon={<MotorcycleIcon size={24} />} title="Vehicle unavailable" description={vehicle.error instanceof Error ? vehicle.error.message : "This vehicle could not be found."} action={<Button onPress={() => vehicle.refetch()}>Try again</Button>} /></main>;
  }
  return <BikeDetailsView bike={vehicleToMotorcycle(vehicle.data)} location={vehicle.data.location} />;
}
