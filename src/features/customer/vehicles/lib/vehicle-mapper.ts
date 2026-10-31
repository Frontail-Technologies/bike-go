import type { Motorcycle, MotorcycleGroup, BikeCategory } from "./view-model";
import type { Vehicle, VehicleModelGroup } from "../types";

const categories = new Set<BikeCategory>(["cruiser", "sports", "adventure", "touring", "scooter"]);
const numberSpec = (specs: Record<string, unknown>, key: string) => typeof specs[key] === "number" ? specs[key] : 0;

export function categoryOf(category: string, vehicleType: string): BikeCategory {
  return categories.has(category as BikeCategory) ? (category as BikeCategory) : vehicleType === "scooter" ? "scooter" : "touring";
}

export function vehicleGroupToMotorcycleGroup(group: VehicleModelGroup): MotorcycleGroup {
  if (group.currency !== "USD") throw new Error("RideGo customer pricing supports USD only.");
  const category = categoryOf(group.category, group.vehicleType);
  const { highlights, colors } = specLists(group.specifications);
  return {
    id: group.groupSlug,
    groupSlug: group.groupSlug,
    name: group.name,
    model: [group.brand, group.model].filter(Boolean).join(" · "),
    brand: group.brand,
    category,
    pricePerDay: group.dailyRentalPriceMinor / 100,
    deposit: group.securityDepositMinor / 100,
    engineCc: group.engineCc ?? 0,
    powerBhp: numberSpec(group.specifications, "powerBhp"),
    torqueNm: numberSpec(group.specifications, "torqueNm"),
    mileageKmpl: numberSpec(group.specifications, "mileageKmpl"),
    gears: numberSpec(group.specifications, "gears"),
    weightKg: numberSpec(group.specifications, "weightKg"),
    fuelTankL: numberSpec(group.specifications, "fuelTankL"),
    transmission: group.transmission?.toLowerCase() === "automatic" ? "automatic" : "manual",
    color: colors[0] ?? "#F2B200",
    colorways: colors.length ? colors : ["#F2B200"],
    images: group.images.flatMap((image) => image.url ? [image.url] : []),
    location: group.locations[0]?.city ?? "",
    description: group.description ?? "",
    highlights,
    available: group.totalAvailable > 0,
    totalAvailable: group.totalAvailable,
    locations: group.locations,
  };
}

export function specLists(specifications: Record<string, unknown>) {
  const highlights = Array.isArray(specifications.highlights)
    ? specifications.highlights.filter((item): item is string => typeof item === "string")
    : [];
  const colors = Array.isArray(specifications.colors)
    ? specifications.colors.filter((item): item is string => typeof item === "string")
    : [];
  return { highlights, colors };
}

export { numberSpec };

export function vehicleToMotorcycle(vehicle: Vehicle): Motorcycle {
  if (vehicle.currency !== "USD") throw new Error("RideGo customer pricing supports USD only.");
  const category = categoryOf(vehicle.category, vehicle.vehicleType);
  const { highlights, colors } = specLists(vehicle.specifications);

  return {
    id: vehicle.slug,
    name: vehicle.name,
    model: [vehicle.brand, vehicle.model].filter(Boolean).join(" · "),
    brand: vehicle.brand,
    category,
    pricePerDay: vehicle.dailyRentalPriceMinor / 100,
    deposit: vehicle.securityDepositMinor / 100,
    engineCc: vehicle.engineCc ?? 0,
    powerBhp: numberSpec(vehicle.specifications, "powerBhp"),
    torqueNm: numberSpec(vehicle.specifications, "torqueNm"),
    mileageKmpl: numberSpec(vehicle.specifications, "mileageKmpl"),
    gears: numberSpec(vehicle.specifications, "gears"),
    weightKg: numberSpec(vehicle.specifications, "weightKg"),
    fuelTankL: numberSpec(vehicle.specifications, "fuelTankL"),
    transmission: vehicle.transmission?.toLowerCase() === "automatic" ? "automatic" : "manual",
    color: colors[0] ?? "#F2B200",
    colorways: colors.length ? colors : ["#F2B200"],
    images: vehicle.images.flatMap((image) => image.url ? [image.url] : []),
    location: vehicle.location.city,
    description: vehicle.description ?? "",
    highlights,
    available: vehicle.status === "available",
  };
}
