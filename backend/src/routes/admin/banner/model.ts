import { t } from "elysia";
import { Envelope, PaginationQuery } from "@/libs/api";
import { BannerPlacement, BannerStatus, CTA_URL_PATTERN, IMAGE_KEY_PATTERN, IMAGE_URL_PATTERN } from "@/routes/banner/model";

const AdminBanner = t.Object({
  id: t.String({ format: "uuid" }),
  title: t.String(),
  subtitle: t.Nullable(t.String()),
  imageStorageKey: t.String(),
  imageUrl: t.Nullable(t.String()),
  ctaLabel: t.Nullable(t.String()),
  ctaUrl: t.Nullable(t.String()),
  placement: BannerPlacement,
  displayOrder: t.Number(),
  status: BannerStatus,
  effectiveStatus: BannerStatus,
  startAt: t.Nullable(t.String({ format: "date-time" })),
  endAt: t.Nullable(t.String({ format: "date-time" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const BannersGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    placement: t.Optional(BannerPlacement),
    status: t.Optional(BannerStatus),
    q: t.Optional(t.String({ minLength: 1, maxLength: 120, description: "Title or subtitle" })),
    sort: t.Optional(t.UnionEnum(["displayOrder", "newest", "oldest", "title", "startAt", "endAt"])),
  }),
  Response: Envelope(t.Array(AdminBanner)),
};

export const BannerGet = { Params: t.Object({ id: t.String({ format: "uuid" }) }), Response: Envelope(AdminBanner) };

export const BannerPost = {
  Body: t.Object(
    {
      title: t.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
      subtitle: t.Optional(t.Nullable(t.String({ maxLength: 240 }))),
      imageStorageKey: t.String({ minLength: 1, maxLength: 300, pattern: IMAGE_KEY_PATTERN, description: "Key of the image in storage; letters, digits, /, _, . and -" }),
      imageUrl: t.Optional(t.Nullable(t.String({ maxLength: 1000, pattern: IMAGE_URL_PATTERN, description: "Public http(s) address the apps can show" }))),
      ctaLabel: t.Optional(t.Nullable(t.String({ maxLength: 60 }))),
      ctaUrl: t.Optional(t.Nullable(t.String({ maxLength: 1000, pattern: CTA_URL_PATTERN, description: "An http(s) URL or an in-app path such as /bikes" }))),
      placement: BannerPlacement,
      displayOrder: t.Optional(t.Integer({ minimum: 0, maximum: 100000 })),
      status: t.Optional(BannerStatus),
      startAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
      endAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
    },
    { additionalProperties: false },
  ),
  Response: Envelope(AdminBanner),
};

export const BannerPatch = {
  Params: BannerGet.Params,
  Body: t.Object({ ...t.Partial(BannerPost.Body).properties }, { additionalProperties: false }),
  Response: Envelope(AdminBanner),
};

export const BannerDelete = { Params: BannerGet.Params, Response: Envelope(t.Object({ id: t.String({ format: "uuid" }) })) };
