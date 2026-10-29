import { z } from "zod";
import { adminError, adminT } from "@/features/admin/i18n/translate";

const coordinate = (labelKey: string, limit: number) =>
  z.string().refine((value) => value === "" || (Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit), { error: () => adminT("locations.validation.coordinate", { label: adminT(labelKey), limit }) });

export const locationFormSchema = z
  .object({
    name: z.string().trim().min(2, adminError("validation.minChars")).max(120),
    address: z.string().trim().min(3, adminError("locations.validation.address")).max(300),
    city: z.string().trim().min(2, adminError("locations.validation.city")).max(80),
    latitude: coordinate("locations.fields.latitude", 90),
    longitude: coordinate("locations.fields.longitude", 180),
    active: z.boolean(),
  })
  .refine((value) => (value.latitude === "") === (value.longitude === ""), { path: ["longitude"], ...adminError("locations.validation.both") });
export type LocationFormValues = z.infer<typeof locationFormSchema>;
