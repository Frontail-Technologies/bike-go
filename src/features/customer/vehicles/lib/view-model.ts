export type VehicleCategory = "cruiser" | "sports" | "adventure" | "touring" | "scooter";
export type VehicleTransmission = "manual" | "automatic";

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
  totalAvailable?: number;
  availableFrom?: string;
  bookedRanges: [string, string][];
};

export type Motorcycle = CustomerVehicle;
export type BikeCategory = VehicleCategory;

export type MotorcycleGroupLocation = { locationId: string; name: string; city: string; availableCount: number };

export type MotorcycleGroup = CustomerVehicle & {
  groupSlug: string;
  totalAvailable: number;
  locations: MotorcycleGroupLocation[];
};
