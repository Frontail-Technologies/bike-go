import { categoryOf, numberSpec, specLists } from "./vehicle-mapper";
import type { MotorcycleGroup } from "./view-model";
import type { VehicleModelGroup } from "../types";

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
    rating: 0,
    reviews: 0,
    engineCc: group.engineCc ?? 0,
    powerBhp: numberSpec(group.specifications, "powerBhp"),
    torqueNm: numberSpec(group.specifications, "torqueNm"),
    mileageKmpl: numberSpec(group.specifications, "mileageKmpl"),
    gears: numberSpec(group.specifications, "gears"),
    weightKg: numberSpec(group.specifications, "weightKg"),
    fuelTankL: numberSpec(group.specifications, "fuelTankL"),
    transmission: group.transmission?.toLowerCase() === "automatic" ? "automatic" : "manual",
    color: colors[0] ?? "#FFC400",
    colorways: colors.length ? colors : ["#FFC400"],
    images: group.images.flatMap((image) => (image.url ? [image.url] : [])),
    location: group.locations[0]?.city ?? "",
    description: group.description ?? "",
    highlights,
    available: group.totalAvailable > 0,
    totalAvailable: group.totalAvailable,
    bookedRanges: [],
    locations: group.locations,
  };
}
