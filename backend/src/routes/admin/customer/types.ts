import type { UnwrapModels, UnwrapSchema } from "elysia";
import type * as Model from "./model";

export type CustomersGet = UnwrapModels<typeof Model.CustomersGet>;
export type CustomerDetail = UnwrapSchema<typeof Model.CustomerGet.Response>["data"];

export type CustomerRow = {
  id: string;
  role: "customer" | "admin" | "super_admin";
  name: string;
  email: string;
  profileName: string | null;
  profileEmail: string | null;
  phone: string | null;
  city: string | null;
  createdAt: Date;
};
