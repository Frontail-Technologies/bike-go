import { z } from "zod";
import { fuelLevels, vehicleConditions } from "../types/booking";

const odometer = z.string().min(1, "Enter the odometer reading.").refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, "Enter a whole number of kilometres.");

export const handoverSchema = z
  .object({
    actualPickupAt: z.string().min(1, "Actual pickup date and time is required."),
    odometerKm: odometer,
    fuelLevel: z.enum(fuelLevels),
    condition: z.enum(vehicleConditions),
    existingDamageNotes: z.string().max(1000, "Keep notes under 1000 characters."),
    licenceVerified: z.boolean(),
    identityVerified: z.boolean(),
    depositVerified: z.boolean(),
    staffNotes: z.string().max(1000, "Keep notes under 1000 characters."),
    depositRequired: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.licenceVerified || !value.identityVerified || (value.depositRequired && !value.depositVerified)) {
      context.addIssue({ code: "custom", path: ["verification"], message: "Complete every required verification before handover." });
    }
  });
export type HandoverValues = z.infer<typeof handoverSchema>;

export const returnSchema = z
  .object({
    actualReturnAt: z.string().min(1, "Actual return date and time is required."),
    odometerKm: odometer,
    fuelLevel: z.enum(fuelLevels),
    condition: z.enum(vehicleConditions),
    newDamageFound: z.boolean(),
    damageNotes: z.string().max(1000, "Keep notes under 1000 characters."),
    staffNotes: z.string().max(1000, "Keep notes under 1000 characters."),
  })
  .superRefine((value, context) => {
    if (value.newDamageFound && !value.damageNotes.trim()) context.addIssue({ code: "custom", path: ["damageNotes"], message: "Describe the new damage found." });
  });
export type ReturnValues = z.infer<typeof returnSchema>;

export const noteSchema = z.string().trim().max(300, "Keep the note under 300 characters.").refine((value) => value === "" || value.length >= 2, "Enter at least 2 characters, or leave it empty.");
