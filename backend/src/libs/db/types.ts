import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as relations from "./relations";
import type * as schema from "./schema";

export type FullSchema = typeof schema & typeof relations;
export type Db = PgDatabase<PgQueryResultHKT, FullSchema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Executor = Db | Tx;

export type SeedVehicle = {
  slug: string;
  vehicleType: "motorcycle" | "scooter";
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  engineCc: number;
  transmission: string;
  fuelType: string;
  seats: number;
  dailyRentalPriceMinor: number;
  securityDepositMinor: number;
  registrationNumber: string;
  location: "phnom-penh" | "siem-reap";
  specifications: Record<string, unknown>;
};
