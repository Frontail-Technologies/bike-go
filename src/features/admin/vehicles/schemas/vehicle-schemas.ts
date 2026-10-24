import { z } from "zod";
import { vehicleStatuses, vehicleTypes } from "../types/vehicle";

const optionalWhole = (label: string) =>
  z.string().refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 1), `${label} must be a positive whole number.`);

const money = (label: string, min: number) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= min, min > 0 ? "Enter an amount greater than zero." : "Enter zero or a positive amount.")
    .refine((value) => !Number.isFinite(Number(value)) || Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 1e-6, "Use at most two decimal places.");

export const vehicleFormSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by dashes."),
  vehicleType: z.enum(vehicleTypes),
  brand: z.string().trim().min(1, "Brand is required."),
  model: z.string().trim().min(1, "Model is required."),
  category: z.string().trim().min(1, "Category is required."),
  description: z.string().trim().max(4000, "Keep the description under 4000 characters."),
  engineCc: optionalWhole("Engine cc"),
  transmission: z.string(),
  fuelType: z.string(),
  seats: optionalWhole("Seats"),
  dailyPrice: money("Daily price", 0.01),
  deposit: money("Deposit", 0),
  locationId: z.string().uuid("Choose a location."),
  registrationNumber: z.string().trim().min(2, "Registration number is required."),
  status: z.enum(vehicleStatuses),
});
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const blockFormSchema = z
  .object({
    startAt: z.string().min(1, "Start date and time is required."),
    endAt: z.string().min(1, "End date and time is required."),
    reason: z.string().trim().min(2, "Reason must contain at least 2 characters.").max(200, "Reason must contain no more than 200 characters."),
  })
  .refine((value) => !value.startAt || !value.endAt || value.endAt > value.startAt, { path: ["endAt"], message: "End date and time must be after the start." });
export type BlockFormValues = z.infer<typeof blockFormSchema>;
