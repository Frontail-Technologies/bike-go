import { json } from "./http";
import { postJson, request } from "./auth";

let nextYear = 2200;

export function rentalWindow(days = 3) {
  const y = nextYear++;
  return {
    y,
    pickupAt: `${y}-03-10T10:00:00.000Z`,
    returnAt: `${y}-03-${10 + days}T10:00:00.000Z`,
    at: (monthDay: string, time = "10:00") => `${y}-${monthDay}T${time}:00.000Z`,
  };
}

export const postBooking = (cookie: string, body: Record<string, unknown>, key?: string) => postJson("/api/v1/bookings", body, { cookie, headers: key ? { "idempotency-key": key } : {} });

export const bookVehicle = (cookie: string, vehicle: string, window = rentalWindow()) => postBooking(cookie, { vehicle, pickupAt: window.pickupAt, returnAt: window.returnAt });

export const availabilityOf = async (slug: string, from: string, to: string) => json(await request(`/api/v1/vehicles/${slug}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));

export const tally = (statuses: number[]) => statuses.reduce<Record<number, number>>((acc, status) => ({ ...acc, [status]: (acc[status] ?? 0) + 1 }), {});
