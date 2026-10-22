import { Elysia } from "elysia";
import { ok, okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as CustomerModel from "./model";
import { adminGetCustomer, adminListCustomers } from "./service";

export const adminCustomerRoutes = new Elysia({ name: "RideGo.Admin.Customer", prefix: "/customers", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: CustomerModel.CustomersGet.Query, response: { 200: CustomerModel.CustomersGet.Response, ...staffErrors }, detail: { summary: "Customers, with search and sorting", description: "Customers only; staff accounts are not listed.", security: sessionSecurity } }, async ({ query }) => okPage(await adminListCustomers(query)))
  .get("/:id", { admin: true, params: CustomerModel.CustomerGet.Params, response: { 200: CustomerModel.CustomerGet.Response, ...staffErrors }, detail: { summary: "One customer with recent bookings and loans", security: sessionSecurity } }, async ({ params }) => ok(await adminGetCustomer(params.id)));
