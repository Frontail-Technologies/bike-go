import type { Motorcycle, BikeCategory } from "./view-model";
import type { Vehicle } from "./types";

const categories = new Set<BikeCategory>(["cruiser", "sports", "adventure", "touring", "scooter"]);
const numberSpec = (specs: Record<string, unknown>, key: string) => typeof specs[key] === "number" ? specs[key] : 0;

export function vehicleToMotorcycle(vehicle: Vehicle): Motorcycle {
  if (vehicle.currency !== "USD") throw new Error("RideGo customer pricing supports USD only.");
  const category = categories.has(vehicle.category as BikeCategory)
    ? vehicle.category as BikeCategory
    : vehicle.vehicleType === "scooter" ? "scooter" : "touring";
  const highlights = Array.isArray(vehicle.specifications.highlights)
    ? vehicle.specifications.highlights.filter((item): item is string => typeof item === "string")
    : [];
  const colors = Array.isArray(vehicle.specifications.colors)
    ? vehicle.specifications.colors.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: vehicle.slug,
    name: vehicle.name,
    model: [vehicle.brand, vehicle.model].filter(Boolean).join(" · "),
    brand: vehicle.brand,
    category,
    pricePerDay: vehicle.dailyRentalPriceMinor / 100,
    deposit: vehicle.securityDepositMinor / 100,
    rating: 0,
    reviews: 0,
    engineCc: vehicle.engineCc ?? 0,
    powerBhp: numberSpec(vehicle.specifications, "powerBhp"),
    torqueNm: numberSpec(vehicle.specifications, "torqueNm"),
    mileageKmpl: numberSpec(vehicle.specifications, "mileageKmpl"),
    gears: numberSpec(vehicle.specifications, "gears"),
    weightKg: numberSpec(vehicle.specifications, "weightKg"),
    fuelTankL: numberSpec(vehicle.specifications, "fuelTankL"),
    transmission: vehicle.transmission?.toLowerCase() === "automatic" ? "automatic" : "manual",
    color: colors[0] ?? "#FFC400",
    colorways: colors.length ? colors : ["#FFC400"],
    images: vehicle.images.flatMap((image) => image.url ? [image.url] : []),
    location: vehicle.location.city,
    description: vehicle.description ?? "",
    highlights,
    available: vehicle.status === "available",
    bookedRanges: [],
  };
}
