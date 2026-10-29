import { z } from "zod";
import { adminError, adminT } from "@/features/admin/i18n/translate";
import { vehicleStatuses, vehicleTypes } from "../types/vehicle";

const labelled = (key: string, labelKey: string) => ({ error: () => adminT(key, { label: adminT(labelKey) }) });

const optionalWhole = (labelKey: string) =>
  z.string().refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 1), labelled("vehicles.validation.wholeNumber", labelKey));

const money = (labelKey: string, min: number) =>
  z
    .string()
    .min(1, labelled("vehicles.validation.required", labelKey))
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= min, adminError(min > 0 ? "vehicles.validation.positive" : "vehicles.validation.nonNegative"))
    .refine((value) => !Number.isFinite(Number(value)) || Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 1e-6, adminError("vehicles.validation.decimals"));

export const vehicleFormSchema = z.object({
  name: z.string().trim().min(2, adminError("vehicles.validation.minChars")).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, adminError("vehicles.validation.slug")),
  vehicleType: z.enum(vehicleTypes),
  brand: z.string().trim().min(1, adminError("vehicles.validation.brand")),
  model: z.string().trim().min(1, adminError("vehicles.validation.model")),
  category: z.string().trim().min(1, adminError("vehicles.validation.category")),
  description: z.string().trim().max(4000, adminError("vehicles.validation.description")),
  engineCc: optionalWhole("vehicles.validation.engineCc"),
  transmission: z.string(),
  fuelType: z.string(),
  seats: optionalWhole("vehicles.validation.seats"),
  dailyPrice: money("vehicles.validation.dailyPrice", 0.01),
  deposit: money("vehicles.validation.deposit", 0),
  locationId: z.string().uuid(adminError("vehicles.validation.location")),
  registrationNumber: z.string().trim().min(2, adminError("vehicles.validation.registration")),
  status: z.enum(vehicleStatuses),
});
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const blockFormSchema = z
  .object({
    startAt: z.string().min(1, adminError("vehicles.validation.startRequired")),
    endAt: z.string().min(1, adminError("vehicles.validation.endRequired")),
    reason: z.string().trim().min(2, adminError("vehicles.validation.reasonMin")).max(200, adminError("vehicles.validation.reasonMax")),
  })
  .refine((value) => !value.startAt || !value.endAt || value.endAt > value.startAt, { path: ["endAt"], ...adminError("vehicles.validation.endAfterStart") });
export type BlockFormValues = z.infer<typeof blockFormSchema>;
