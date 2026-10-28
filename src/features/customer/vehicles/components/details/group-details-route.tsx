"use client";

import { MotorcycleIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { BikeDetailsSkeleton } from "./bike-details-skeleton";
import { useVehicleModelGroupQuery } from "@/features/customer/vehicles/hooks/use-vehicles";
import { vehicleGroupToMotorcycleGroup } from "@/features/customer/vehicles/lib/vehicle-group-mapper";
import { cambodiaRentalRange } from "@/lib/cambodia-time";
import { GroupDetailsView } from "./group-details-view";

export function GroupDetailsRoute({ groupSlug }: { groupSlug: string }) {
  const params = useSearchParams();
  const start = params.get("start");
  const end = params.get("end");
  const range: { pickupAt?: string; returnAt?: string } = start && end ? cambodiaRentalRange(start, end) : {};
  const group = useVehicleModelGroupQuery(groupSlug, { start: range.pickupAt, end: range.returnAt });
  if (group.isPending) return <BikeDetailsSkeleton variant="group" />;
  if (group.isError || !group.data) {
    return (
      <main className="mx-auto flex min-h-[60dvh] max-w-lg items-center px-page">
        <EmptyState icon={<MotorcycleIcon size={24} />} title="Vehicle unavailable" action={<Button variant="outline" onPress={() => group.refetch()}>Try again</Button>} />
      </main>
    );
  }
  return <GroupDetailsView group={vehicleGroupToMotorcycleGroup(group.data)} />;
}
