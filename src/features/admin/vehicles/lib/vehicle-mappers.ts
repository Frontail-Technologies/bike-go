import type { Vehicle, VehicleFields } from "../types/vehicle";
import type { VehicleFormValues } from "../schemas/vehicle-schemas";

export const blankVehicleForm: VehicleFormValues = { name: "", slug: "", vehicleType: "motorcycle", brand: "", model: "", category: "", description: "", engineCc: "", transmission: "", fuelType: "", seats: "", dailyPrice: "", deposit: "", locationId: "", registrationNumber: "", status: "available" };

const dollars = (minor: number) => (minor / 100).toFixed(2);

export const vehicleToFormValues = (vehicle: Vehicle): VehicleFormValues => ({
  name: vehicle.name, slug: vehicle.slug, vehicleType: vehicle.vehicleType, brand: vehicle.brand, model: vehicle.model, category: vehicle.category,
  description: vehicle.description ?? "", engineCc: vehicle.engineCc?.toString() ?? "", transmission: vehicle.transmission ?? "", fuelType: vehicle.fuelType ?? "", seats: vehicle.seats?.toString() ?? "",
  dailyPrice: dollars(vehicle.dailyRentalPriceMinor), deposit: dollars(vehicle.securityDepositMinor),
  locationId: vehicle.location.id, registrationNumber: vehicle.registrationNumber, status: vehicle.status,
});

export const formValuesToFields = (values: VehicleFormValues): VehicleFields => ({
  slug: values.slug, vehicleType: values.vehicleType, name: values.name, brand: values.brand, model: values.model, category: values.category,
  description: values.description || null, engineCc: values.engineCc ? Number(values.engineCc) : null, transmission: values.transmission || null, fuelType: values.fuelType || null, seats: values.seats ? Number(values.seats) : null,
  dailyRentalPriceMinor: Math.round(Number(values.dailyPrice) * 100), securityDepositMinor: Math.round(Number(values.deposit) * 100),
  registrationNumber: values.registrationNumber, locationId: values.locationId, status: values.status,
});

export const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
