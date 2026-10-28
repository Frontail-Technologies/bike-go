"use client";

import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";
import { useVehicleQuery } from "@/features/customer/vehicles/hooks/use-vehicles";
import { vehicleToMotorcycle } from "@/features/customer/vehicles/lib/vehicle-mapper";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";
import { BookingFlow } from "./booking-flow";

export function BookingRoute({ id }: { id: string }) {
  const vehicle = useVehicleQuery(id);
  if (vehicle.isPending) return <BikeDetailsSkeleton />;
  if (vehicle.isError || !vehicle.data) return <p className="p-page text-sm text-danger">This vehicle is unavailable.</p>;
  const bike = vehicleToMotorcycle(vehicle.data);
  return (
    <CustomerAuthBoundary>
      <BookingFlow
        bike={bike}
        target={{ kind: "vehicle", vehicle: vehicle.data }}
        detailsHref={`/bikes/${bike.id}`}
        bookHref={`/bikes/${bike.id}/book`}
      />
    </CustomerAuthBoundary>
  );
}
