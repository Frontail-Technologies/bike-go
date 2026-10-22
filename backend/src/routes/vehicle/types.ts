import type { UnwrapModels, UnwrapSchema } from "elysia";
import type * as Model from "./model";

export type VehiclesGet = UnwrapModels<typeof Model.VehiclesGet>;
export type PublicVehicle = UnwrapSchema<typeof Model.Vehicle>;

export type VehicleListRow = {
  id: string;
  slug: string;
  vehicleType: "motorcycle" | "scooter" | "car" | "other";
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
  currency: "USD" | "KHR";
  status: "available" | "rented" | "maintenance" | "inactive";
  specifications: Record<string, unknown>;
  locationId: string;
  locationName: string;
  locationCity: string;
  locationAddress: string;
};
