import { Elysia } from "elysia";
import { ok, okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as BannerModel from "./model";
import { adminGetBanner, adminListBanners, createBanner, deleteBanner, updateBanner } from "./service";

export const adminBannerRoutes = new Elysia({ name: "RideGo.Admin.Banner", prefix: "/banners", tags: ["Admin"] })
  .use(authPlugin)
  .get(
    "",
    {
      admin: true,
      query: BannerModel.BannersGet.Query,
      response: { 200: BannerModel.BannersGet.Response, ...staffErrors },
      detail: { summary: "Banners with placement, status and search filters", description: "The status filter uses the effective status: what visitors get right now, not only the stored value.", security: sessionSecurity },
    },
    async ({ query }) => okPage(await adminListBanners(query)),
  )
  .get("/:id", { admin: true, params: BannerModel.BannerGet.Params, response: { 200: BannerModel.BannerGet.Response, ...staffErrors }, detail: { summary: "One banner", security: sessionSecurity } }, async ({ params }) => ok(await adminGetBanner(params.id)))
  .post(
    "",
    { admin: true, body: BannerModel.BannerPost.Body, response: { 200: BannerModel.BannerPost.Response, ...staffErrors }, detail: { summary: "Create a banner (image metadata only)", security: sessionSecurity } },
    async ({ body }) => ok(await createBanner(body)),
  )
  .patch(
    "/:id",
    { admin: true, params: BannerModel.BannerPatch.Params, body: BannerModel.BannerPatch.Body, response: { 200: BannerModel.BannerPatch.Response, ...staffErrors }, detail: { summary: "Update a banner", security: sessionSecurity } },
    async ({ params, body }) => ok(await updateBanner(params.id, body)),
  )
  .delete(
    "/:id",
    { admin: true, params: BannerModel.BannerDelete.Params, response: { 200: BannerModel.BannerDelete.Response, ...staffErrors }, detail: { summary: "Delete a banner", description: "Nothing references a banner, so it is removed. To only hide one, set its status to inactive.", security: sessionSecurity } },
    async ({ params }) => ok(await deleteBanner(params.id)),
  );
