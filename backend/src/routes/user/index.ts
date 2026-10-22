import { Elysia } from "elysia";
import { customerErrors, ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as UserModel from "./model";
import { getMe, updateMe } from "./service";

export const userRoutes = new Elysia({ name: "RideGo.User", prefix: "/api/v1/me", tags: ["Me"] })
  .use(authPlugin)
  .get(
    "",
    { auth: true, response: { 200: UserModel.MeGet.Response, ...customerErrors }, detail: { summary: "Current customer's profile", security: [{ sessionCookie: [] }] } },
    async ({ user }) => ok(await getMe(user.id)),
  )
  .patch(
    "",
    {
      auth: true,
      body: UserModel.MePatch.Body,
      response: { 200: UserModel.MePatch.Response, ...customerErrors },
      detail: { summary: "Update the current customer's profile", description: "Only profile fields are writable. Role and identity cannot be changed here.", security: [{ sessionCookie: [] }] },
    },
    async ({ user, body }) => ok(await updateMe(user.id, body)),
  );
