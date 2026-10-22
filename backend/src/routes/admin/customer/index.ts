import { Elysia } from "elysia";
import { ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as CustomerModel from "./model";
import { adminGetCustomer, adminListCustomers } from "./service";

const security = [{ sessionCookie: [] }];

export const adminCustomerRoutes = new Elysia({ name: "RideGo.Admin.Customer", prefix: "/customers", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: CustomerModel.CustomersGet.Query, response: { 200: CustomerModel.CustomersGet.Response }, detail: { summary: "Customers, with search and sorting", description: "Customers only; staff accounts are not listed.", security } }, async ({ query }) => {
    const { data, meta } = await adminListCustomers(query);
    return ok(data, meta);
  })
  .get("/:id", { admin: true, params: CustomerModel.CustomerGet.Params, response: { 200: CustomerModel.CustomerGet.Response }, detail: { summary: "One customer with recent bookings and loans", security } }, async ({ params }) => ok(await adminGetCustomer(params.id)));
