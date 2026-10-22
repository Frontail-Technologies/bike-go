export type Availability = {
  vehicleId: string;
  from: string;
  to: string;
  bookable: boolean;
  reason: "vehicle_unavailable" | "period_taken" | null;
  unavailablePeriods: { start: string; end: string; kind: "booking" | "block" }[];
};
