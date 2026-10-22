import type { UnwrapModels, UnwrapSchema } from "elysia";
import type * as Model from "./model";

export type AdminBookingView = UnwrapSchema<typeof Model.AdminBooking>;
export type BookingsGet = UnwrapModels<typeof Model.BookingsGet>;
export type BookingStatusPatch = UnwrapModels<typeof Model.BookingStatusPatch>;
