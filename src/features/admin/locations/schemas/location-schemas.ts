import { z } from "zod";

const coordinate = (label: string, limit: number) =>
  z.string().refine((value) => value === "" || (Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit), `${label} must be between -${limit} and ${limit}.`);

export const locationFormSchema = z
  .object({
    name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
    address: z.string().trim().min(3, "Enter the street address.").max(300),
    city: z.string().trim().min(2, "Enter a city.").max(80),
    latitude: coordinate("Latitude", 90),
    longitude: coordinate("Longitude", 180),
    active: z.boolean(),
  })
  .refine((value) => (value.latitude === "") === (value.longitude === ""), { path: ["longitude"], message: "Enter both latitude and longitude, or leave both empty." });
export type LocationFormValues = z.infer<typeof locationFormSchema>;
