import { t } from "elysia";
import { Currency, Envelope, PaginationQuery } from "@/libs/api";

export const VehicleType = t.UnionEnum(["motorcycle", "scooter", "car", "other"]);
export const VehicleStatus = t.UnionEnum(["available", "rented", "maintenance", "inactive"]);

export const VehicleImage = t.Object({
  id: t.String({ format: "uuid" }),
  url: t.Nullable(t.String()),
  altText: t.Nullable(t.String()),
  sortOrder: t.Number(),
});

export const Vehicle = t.Object({
  id: t.String({ format: "uuid" }),
  slug: t.String(),
  vehicleType: VehicleType,
  name: t.String(),
  brand: t.String(),
  model: t.String(),
  category: t.String(),
  description: t.Nullable(t.String()),
  engineCc: t.Nullable(t.Number()),
  transmission: t.Nullable(t.String()),
  fuelType: t.Nullable(t.String()),
  seats: t.Nullable(t.Number()),
  dailyRentalPriceMinor: t.Number({ description: "Integer minor units (cents/sen) of `currency`" }),
  securityDepositMinor: t.Number({ description: "Refundable deposit, integer minor units of `currency`" }),
  currency: Currency,
  status: VehicleStatus,
  specifications: t.Record(t.String(), t.Unknown()),
  location: t.Object({ id: t.String({ format: "uuid" }), name: t.String(), city: t.String(), address: t.String() }),
  images: t.Array(VehicleImage),
});

export const VehiclesGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    ...t.Object({
      locationId: t.Optional(t.String({ format: "uuid" })),
      vehicleType: t.Optional(VehicleType),
      category: t.Optional(t.String()),
      brand: t.Optional(t.String()),
      transmission: t.Optional(t.String()),
      minPrice: t.Optional(t.Numeric({ minimum: 0, description: "Daily price, minor units" })),
      maxPrice: t.Optional(t.Numeric({ minimum: 0, description: "Daily price, minor units" })),
      minEngineCc: t.Optional(t.Numeric({ minimum: 0 })),
      maxEngineCc: t.Optional(t.Numeric({ minimum: 0 })),
      pickupAt: t.Optional(t.String({ format: "date-time", description: "With returnAt: only vehicles free for this whole period" })),
      returnAt: t.Optional(t.String({ format: "date-time" })),
      sort: t.Optional(t.UnionEnum(["price_asc", "price_desc", "name", "newest"])),
    }).properties,
  }),
  Response: Envelope(t.Array(Vehicle)),
};

export const VehicleByIdGet = {
  Params: t.Object({ idOrSlug: t.String({ description: "Vehicle slug or UUID" }) }),
  Response: Envelope(Vehicle),
};
