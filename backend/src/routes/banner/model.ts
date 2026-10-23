import { t } from "elysia";
import { Envelope } from "@/libs/api";
import { BANNER_PLACEMENTS, BANNER_STATUSES } from "@/libs/db/schema";

export const BannerPlacement = t.UnionEnum([...BANNER_PLACEMENTS]);
export const BannerStatus = t.UnionEnum([...BANNER_STATUSES]);

export const CTA_URL_PATTERN = "^(|https?://[^\\s]+|/([^\\s/][^\\s]*)?)$";

export const PublicBanner = t.Object({
  id: t.String({ format: "uuid" }),
  title: t.String(),
  subtitle: t.Nullable(t.String()),
  imageUrl: t.String({ description: "Address of the banner image on this API" }),
  ctaLabel: t.Nullable(t.String()),
  ctaUrl: t.Nullable(t.String()),
  placement: BannerPlacement,
  displayOrder: t.Number(),
  startAt: t.Nullable(t.String({ format: "date-time" })),
  endAt: t.Nullable(t.String({ format: "date-time" })),
});

export const BannersGet = {
  Query: t.Object({ placement: t.Optional(BannerPlacement) }),
  Response: Envelope(t.Array(PublicBanner)),
};

export const BannerImageGet = { Params: t.Object({ id: t.String({ format: "uuid" }) }) };
