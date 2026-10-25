export type VehicleType = "motorcycle" | "scooter" | "car" | "other";
export type VehicleStatus = "available" | "rented" | "maintenance" | "inactive";

export type VehicleImage = { id: string; url: string | null; altText: string | null; sortOrder: number; isPrimary: boolean };
export type VehicleLocation = { id: string; name: string; city: string; address: string };

export type Vehicle = {
  id: string;
  slug: string;
  vehicleType: VehicleType;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string | null;
  engineCc: number | null;
  transmission: string | null;
  fuelType: string | null;
  seats: number | null;
  dailyRentalPriceMinor: number;
  securityDepositMinor: number;
  currency: "USD";
  status: VehicleStatus;
  specifications: Record<string, unknown>;
  location: VehicleLocation;
  images: VehicleImage[];
};

export type VehicleListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  locationId?: string;
  vehicleType?: VehicleType;
  category?: string;
  brand?: string[];
  transmission?: string[];
  availableOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minEngineCc?: number;
  maxEngineCc?: number;
  pickupAt?: string;
  returnAt?: string;
  sort?: "price_asc" | "price_desc" | "name" | "newest";
};

export type VehicleAvailabilityParams = { from: string; to: string };
export type VehicleAvailability = {
  vehicleId: string;
  from: string;
  to: string;
  bookable: boolean;
  reason: "vehicle_unavailable" | "period_taken" | null;
  unavailablePeriods: { start: string; end: string; kind: "booking" | "block" }[];
};
