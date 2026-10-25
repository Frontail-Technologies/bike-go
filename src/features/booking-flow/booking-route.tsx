"use client";

import { CustomerAuthBoundary } from "@/features/auth/customer-auth-boundary";
import { useVehicleQuery } from "@/features/vehicles/hooks/generated";
import { vehicleToMotorcycle } from "@/features/vehicles/vehicle-mapper";
import { BikeDetailsSkeleton } from "@/features/bike-details/bike-details-skeleton";
import { BookingFlow } from "./booking-flow";

export function BookingRoute({ id }: { id: string }) {
  const vehicle = useVehicleQuery(id);
  if (vehicle.isPending) return <BikeDetailsSkeleton />;
  if (vehicle.isError || !vehicle.data) return <p className="p-page text-sm text-danger">This vehicle is unavailable.</p>;
  return <CustomerAuthBoundary><BookingFlow bike={vehicleToMotorcycle(vehicle.data)} vehicle={vehicle.data} /></CustomerAuthBoundary>;
}
