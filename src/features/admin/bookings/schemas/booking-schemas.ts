import { z } from "zod";
import { adminError, adminT } from "@/features/admin/i18n/translate";
import { fuelLevels, vehicleConditions } from "../types/booking";

const odometer = z.string().min(1, adminError("bookings.validation.odometer")).refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, adminError("bookings.validation.wholeKm"));

export const handoverSchema = z
  .object({
    actualPickupAt: z.string().min(1, adminError("bookings.validation.pickupRequired")),
    odometerKm: odometer,
    fuelLevel: z.enum(fuelLevels),
    condition: z.enum(vehicleConditions),
    existingDamageNotes: z.string().max(1000, adminError("bookings.validation.notes")),
    licenceVerified: z.boolean(),
    identityVerified: z.boolean(),
    depositVerified: z.boolean(),
    staffNotes: z.string().max(1000, adminError("bookings.validation.notes")),
    depositRequired: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.licenceVerified || !value.identityVerified || (value.depositRequired && !value.depositVerified)) {
      context.addIssue({ code: "custom", path: ["verification"], message: adminT("bookings.validation.verification") });
    }
  });
export type HandoverValues = z.infer<typeof handoverSchema>;

export const returnSchema = z
  .object({
    actualReturnAt: z.string().min(1, adminError("bookings.validation.returnRequired")),
    odometerKm: odometer,
    fuelLevel: z.enum(fuelLevels),
    condition: z.enum(vehicleConditions),
    newDamageFound: z.boolean(),
    damageNotes: z.string().max(1000, adminError("bookings.validation.notes")),
    staffNotes: z.string().max(1000, adminError("bookings.validation.notes")),
  })
  .superRefine((value, context) => {
    if (value.newDamageFound && !value.damageNotes.trim()) context.addIssue({ code: "custom", path: ["damageNotes"], message: adminT("bookings.validation.damage") });
  });
export type ReturnValues = z.infer<typeof returnSchema>;

export const noteSchema = z.string().trim().max(300, adminError("bookings.validation.noteMax")).refine((value) => value === "" || value.length >= 2, adminError("bookings.validation.noteMin"));
