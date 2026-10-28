export type VehicleCategory = "cruiser" | "sports" | "adventure" | "touring" | "scooter";
export type VehicleTransmission = "manual" | "automatic";

/** Customer-facing vehicle model used by the existing cards and booking flow. */
export type CustomerVehicle = {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: VehicleCategory;
  pricePerDay: number;
  deposit: number;
  rating: number;
  reviews: number;
  engineCc: number;
  powerBhp: number;
  torqueNm: number;
  mileageKmpl: number;
  gears: number;
  weightKg: number;
  fuelTankL: number;
  transmission: VehicleTransmission;
  color: string;
  colorways: string[];
  images: string[];
  location: string;
  description: string;
  highlights: string[];
  available: boolean;
  /** Set only on a grouped "model" card; when present, the card shows this count instead of the plain available/on-rent badge. */
  totalAvailable?: number;
  availableFrom?: string;
  bookedRanges: [string, string][];
};

// Compatibility aliases while the public routes still use /bikes terminology.
export type Motorcycle = CustomerVehicle;
export type BikeCategory = VehicleCategory;

export type MotorcycleGroupLocation = { locationId: string; name: string; city: string; availableCount: number };

/** One brand+model across every location; booking resolves to a specific unit only once a location is picked. */
export type MotorcycleGroup = CustomerVehicle & {
  groupSlug: string;
  totalAvailable: number;
  locations: MotorcycleGroupLocation[];
};
