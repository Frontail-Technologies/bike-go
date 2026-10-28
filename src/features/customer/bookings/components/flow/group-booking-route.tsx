"use client";

import { useSearchParams } from "next/navigation";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";
import { useVehicleModelGroupQuery } from "@/features/customer/vehicles/hooks/use-vehicles";
import { vehicleGroupToMotorcycleGroup } from "@/features/customer/vehicles/lib/vehicle-group-mapper";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";
import { BookingFlow } from "./booking-flow";

export function GroupBookingRoute({ groupSlug }: { groupSlug: string }) {
  const params = useSearchParams();
  const locationId = params.get("locationId");
  const group = useVehicleModelGroupQuery(groupSlug, {});
  if (group.isPending) return <BikeDetailsSkeleton />;
  if (group.isError || !group.data || !locationId) return <p className="p-page text-sm text-danger">This vehicle is unavailable.</p>;
  const bike = vehicleGroupToMotorcycleGroup(group.data);
  return (
    <CustomerAuthBoundary>
      <BookingFlow
        bike={bike}
        target={{ kind: "group", group: { brand: group.data.brand, model: group.data.model, locationId } }}
        detailsHref={`/bikes/models/${groupSlug}`}
        bookHref={`/bikes/models/${groupSlug}/book`}
      />
    </CustomerAuthBoundary>
  );
}
