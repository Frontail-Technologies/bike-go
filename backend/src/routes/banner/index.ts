import { Elysia } from "elysia";
import { ok, publicErrors } from "@/libs/api";
import * as BannerModel from "./model";
import { listLiveBanners, liveBannerImage } from "./service";

export const bannerRoutes = new Elysia({ name: "RideGo.Banner", prefix: "/api/v1/banners", tags: ["Banners"] })
  .get(
    "",
    {
      query: BannerModel.BannersGet.Query,
      response: { 200: BannerModel.BannersGet.Response, ...publicErrors },
      detail: {
        summary: "Banners that are showing right now",
        description:
          "Inactive and expired banners are never returned, and a scheduled banner appears only once its start time has passed and disappears at its end time. Sorted by display order, then creation time. `imageUrl` points at this API; internal storage keys are never exposed.",
      },
    },
    async ({ query }) => ok(await listLiveBanners(query)),
  )
  .get("/:id/image", { params: BannerModel.BannerImageGet.Params, detail: { summary: "The image of a banner that is showing now", description: "404 while the banner is hidden, scheduled or expired." } }, async ({ params }) => liveBannerImage(params.id));
