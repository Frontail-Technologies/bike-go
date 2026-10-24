export const masterKinds = ["vehicle_type", "vehicle_category", "brand", "transmission", "fuel_type", "block_reason", "loan_type"] as const;
export type MasterKind = (typeof masterKinds)[number];

export type MasterItem = {
  id: string;
  kind: MasterKind;
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
};

export type MasterPageParams = {
  page: number;
  pageSize: number;
  search?: string;
  active?: boolean;
  sortBy?: "name" | "code" | "active" | "sortOrder" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export type MasterPageMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type MasterInput = { name: string; code?: string; active: boolean };
