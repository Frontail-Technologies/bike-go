import { Elysia } from "elysia";
import { okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as AuditModel from "./model";
import { listAudit } from "./service";

export const adminAuditRoutes = new Elysia({ name: "RideGo.Admin.Audit", prefix: "/audit-log", tags: ["Admin"] }).use(authPlugin).get(
  "",
  {
    superAdmin: true,
    query: AuditModel.AuditGet.Query,
    response: { 200: AuditModel.AuditGet.Response, ...staffErrors },
    detail: {
      summary: "Who changed what: the staff action log",
      description: "Super admins only. Newest first. Records the actor, action, target and the names of the fields or statuses involved, never the values of personal data.",
      security: sessionSecurity,
    },
  },
  async ({ query }) => okPage(await listAudit(query)),
);
