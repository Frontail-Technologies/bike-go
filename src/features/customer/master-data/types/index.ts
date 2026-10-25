export type MasterKind =
  | "vehicle_type"
  | "vehicle_category"
  | "brand"
  | "transmission"
  | "fuel_type"
  | "block_reason"
  | "loan_type";

export type MasterItem = {
  id: string;
  kind: MasterKind;
  name: string;
  code: string;
  active: boolean;
  sortOrder: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
