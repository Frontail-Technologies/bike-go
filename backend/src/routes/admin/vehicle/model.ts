import { t } from "elysia";
import { Currency, Envelope, PaginationQuery } from "@/libs/api";
import { MAX_VEHICLE_IMAGES } from "@/routes/vehicle/images";
import { Vehicle, VehicleStatus, VehicleType } from "@/routes/vehicle/model";

const Slug = t.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", minLength: 2, maxLength: 80, description: "lowercase-words-with-dashes" });

const whole = (options: { minimum: number; maximum: number; description?: string }) => t.Numeric({ ...options, multipleOf: 1 });
const optionalText = (maxLength: number) => t.Optional(t.Nullable(t.String({ maxLength, description: "Send an empty value to clear it" })));

const Writable = {
  vehicleType: VehicleType,
  name: t.String({ minLength: 2, maxLength: 120 }),
  brand: t.String({ minLength: 1, maxLength: 80 }),
  model: t.String({ minLength: 1, maxLength: 80 }),
  category: t.String({ minLength: 1, maxLength: 50 }),
  dailyRentalPriceMinor: whole({ minimum: 1, maximum: 1_000_000_000, description: "Minor units of `currency`" }),
  securityDepositMinor: whole({ minimum: 0, maximum: 1_000_000_000, description: "Minor units of `currency`" }),
  currency: Currency,
  registrationNumber: t.String({ minLength: 2, maxLength: 30 }),
  locationId: t.String({ format: "uuid" }),
  status: VehicleStatus,
};

const Optional = {
  description: optionalText(4000),
  engineCc: t.Optional(t.Nullable(whole({ minimum: 1, maximum: 10000 }))),
  transmission: optionalText(40),
  fuelType: optionalText(40),
  seats: t.Optional(t.Nullable(whole({ minimum: 1, maximum: 60 }))),
  specifications: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.String({ description: "A JSON object, for example {\"abs\":true}" })])),
};

const IdList = (description: string) => t.Optional(t.Union([t.Array(t.String({ format: "uuid" })), t.String({ description })]));

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
  Body: t.Object(
    {
      slug: Slug,
      ...Writable,
      status: t.Optional(Writable.status),
      ...Optional,
      images: t.Optional(t.Files({ maxItems: MAX_VEHICLE_IMAGES, description: `Up to ${MAX_VEHICLE_IMAGES} images (JPEG, PNG or WebP, up to 5 MB each). Repeat the field for several files.` })),
      primaryImageIndex: t.Optional(t.Numeric({ minimum: 0, multipleOf: 1, description: "Position in `images` (starting at 0) of the primary image. Defaults to the first file" })),
    },
    { additionalProperties: false },
  ),
  Response: Envelope(AdminVehicle),
};

export const VehicleByIdParams = t.Object({ id: t.String({ format: "uuid" }) });

export const VehiclePatch = {
  Params: VehicleByIdParams,
  Body: t.Object(
    {
      ...t.Partial(t.Object(Writable)).properties,
      slug: t.Optional(Slug),
      ...Optional,
      images: t.Optional(t.Files({ maxItems: MAX_VEHICLE_IMAGES, description: "New images to add after the existing ones" })),
      removeImageIds: IdList("Image ids to remove: a JSON array or comma-separated ids"),
      imageOrder: IdList("Existing image ids in the order wanted: a JSON array or comma-separated ids. Images not listed follow in their current order"),
      primaryImageId: t.Optional(t.String({ format: "uuid", description: "An existing image to make primary" })),
      primaryImageIndex: t.Optional(t.Numeric({ minimum: 0, multipleOf: 1, description: "Or the position in the new `images` (starting at 0) to make primary" })),
    },
    { additionalProperties: false },
  ),
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
