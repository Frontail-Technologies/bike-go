import { t, type UnwrapModels } from "elysia";
import { Currency, Envelope, PaginationQuery } from "@/libs/api";
import { Vehicle, VehicleStatus, VehicleType } from "@/routes/vehicle/model";

const ImageInput = t.Object({
  storageKey: t.String({ minLength: 1, maxLength: 300 }),
  publicUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  altText: t.Optional(t.Nullable(t.String({ maxLength: 200 }))),
  sortOrder: t.Optional(t.Integer({ minimum: 0 })),
});

const Slug = t.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", minLength: 2, maxLength: 80, description: "lowercase-words-with-dashes" });

const Writable = {
  vehicleType: VehicleType,
  name: t.String({ minLength: 2, maxLength: 120 }),
  brand: t.String({ minLength: 1, maxLength: 80 }),
  model: t.String({ minLength: 1, maxLength: 80 }),
  category: t.String({ minLength: 1, maxLength: 50 }),
  description: t.Nullable(t.String({ maxLength: 4000 })),
  engineCc: t.Nullable(t.Integer({ minimum: 1, maximum: 10000 })),
  transmission: t.Nullable(t.String({ maxLength: 40 })),
  fuelType: t.Nullable(t.String({ maxLength: 40 })),
  seats: t.Nullable(t.Integer({ minimum: 1, maximum: 60 })),
  dailyRentalPriceMinor: t.Integer({ minimum: 1, description: "Minor units of `currency`" }),
  securityDepositMinor: t.Integer({ minimum: 0, description: "Minor units of `currency`" }),
  currency: Currency,
  registrationNumber: t.String({ minLength: 2, maxLength: 30 }),
  locationId: t.String({ format: "uuid" }),
  status: VehicleStatus,
  specifications: t.Record(t.String(), t.Unknown()),
};

export const AdminVehicle = t.Object({
  ...Vehicle.properties,
  registrationNumber: t.String(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const VehiclesGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    q: t.Optional(t.String({ minLength: 1 })),
    status: t.Optional(VehicleStatus),
    locationId: t.Optional(t.String({ format: "uuid" })),
    vehicleType: t.Optional(VehicleType),
  }),
  Response: Envelope(t.Array(AdminVehicle)),
};

export const VehiclePost = {
  Body: t.Object({
    slug: Slug,
    ...Writable,
    description: t.Optional(Writable.description),
    engineCc: t.Optional(Writable.engineCc),
    transmission: t.Optional(Writable.transmission),
    fuelType: t.Optional(Writable.fuelType),
    seats: t.Optional(Writable.seats),
    status: t.Optional(Writable.status),
    specifications: t.Optional(Writable.specifications),
    images: t.Optional(t.Array(ImageInput, { maxItems: 20 })),
  }),
  Response: Envelope(AdminVehicle),
};

export const VehicleByIdParams = t.Object({ id: t.String({ format: "uuid" }) });

export const VehiclePatch = {
  Params: VehicleByIdParams,
  Body: t.Object({
    ...t.Partial(t.Object(Writable)).properties,
    slug: t.Optional(Slug),
    images: t.Optional(t.Array(ImageInput, { maxItems: 20, description: "When present, replaces all images" })),
  }),
  Response: Envelope(AdminVehicle),
};

export const VehicleDelete = {
  Params: VehicleByIdParams,
  Response: Envelope(t.Object({ id: t.String({ format: "uuid" }), deleted: t.Boolean(), deactivated: t.Boolean() })),
};

export const BlockPost = {
  Params: VehicleByIdParams,
  Body: t.Object({
    startAt: t.String({ format: "date-time" }),
    endAt: t.String({ format: "date-time" }),
    reason: t.String({ minLength: 2, maxLength: 200 }),
  }),
};

export const Block = t.Object({ id: t.String({ format: "uuid" }), vehicleId: t.String({ format: "uuid" }), startAt: t.String({ format: "date-time" }), endAt: t.String({ format: "date-time" }), reason: t.String() });

export type VehiclePost = UnwrapModels<typeof VehiclePost>;
export type VehiclePatch = UnwrapModels<typeof VehiclePatch>;
export type VehiclesGet = UnwrapModels<typeof VehiclesGet>;
export type BlockPost = UnwrapModels<typeof BlockPost>;
