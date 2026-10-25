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
  availableFrom?: string;
  bookedRanges: [string, string][];
};

// Compatibility aliases while the public routes still use /bikes terminology.
export type Motorcycle = CustomerVehicle;
export type BikeCategory = VehicleCategory;
