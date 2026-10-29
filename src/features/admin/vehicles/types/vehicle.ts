export type VehicleType = "motorcycle" | "scooter" | "car" | "other";
export type VehicleStatus = "available" | "rented" | "maintenance" | "inactive";
export const vehicleTypes = ["motorcycle", "scooter", "car", "other"] as const;
export const vehicleStatuses = ["available", "rented", "maintenance", "inactive"] as const;

export type VehicleImage = { id: string; url: string | null; altText: string | null; sortOrder: number; isPrimary: boolean };
export type VehicleLocation = { id: string; name: string; city: string; address: string };

export type Vehicle = {
  id: string;
  slug: string;
  vehicleType: VehicleType;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string | null;
  engineCc: number | null;
  transmission: string | null;
  fuelType: string | null;
  seats: number | null;
  dailyRentalPriceMinor: number;
  securityDepositMinor: number;
  currency: "USD" | "KHR";
  status: VehicleStatus;
  specifications: Record<string, unknown>;
  registrationNumber: string;
  location: VehicleLocation;
  images: VehicleImage[];
  createdAt: string;
  updatedAt: string;
};

export type VehicleSortBy = "createdAt" | "name" | "brand" | "category" | "dailyRentalPriceMinor" | "status";

export type VehicleListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: VehicleStatus;
  vehicleType?: VehicleType;
  category?: string;
  locationId?: string;
  sortBy?: VehicleSortBy;
  sortOrder?: "asc" | "desc";
};

export type VehicleListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type VehicleFields = {
  slug: string;
  vehicleType: VehicleType;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string | null;
  engineCc: number | null;
  transmission: string | null;
  fuelType: string | null;
  seats: number | null;
  dailyRentalPriceMinor: number;
  securityDepositMinor: number;
  registrationNumber: string;
  locationId: string;
  status: VehicleStatus;
};

export type VehicleImageChanges = {
  images: File[];
  primaryImageIndex?: number;
  removeImageIds?: string[];
  imageOrder?: string[];
  primaryImageId?: string;
};

export type VehicleCreateInput = VehicleFields & Pick<VehicleImageChanges, "images" | "primaryImageIndex">;
export type VehicleUpdateInput = Partial<VehicleFields> & Partial<VehicleImageChanges>;

export type VehicleBlock = { id: string; vehicleId: string; startAt: string; endAt: string; reason: string };
export type VehicleBlockInput = { startAt: string; endAt: string; reason: string };
export type VehicleDeleteResult = { id: string; deleted: boolean; deactivated: boolean };
