import { t } from "elysia";
import { Envelope, PaginationQuery } from "@/libs/api";
import { BannerPlacement, BannerStatus, CTA_URL_PATTERN } from "@/routes/banner/model";

const AdminBanner = t.Object({
  id: t.String({ format: "uuid" }),
  title: t.String(),
  subtitle: t.Nullable(t.String()),
  imageUrl: t.String({ description: "Staff-only address of the image, available whatever the banner status" }),
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

const Fields = {
  title: t.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
  subtitle: t.Optional(t.Nullable(t.String({ maxLength: 240, description: "Send an empty value to clear it" }))),
  ctaLabel: t.Optional(t.Nullable(t.String({ maxLength: 60 }))),
  ctaUrl: t.Optional(t.Nullable(t.String({ maxLength: 1000, pattern: CTA_URL_PATTERN, description: "An http(s) URL or an in-app path such as /bikes" }))),
  placement: BannerPlacement,
  displayOrder: t.Optional(t.Numeric({ minimum: 0, maximum: 100000, multipleOf: 1 })),
  status: t.Optional(BannerStatus),
  startAt: t.Optional(t.Nullable(t.String({ maxLength: 40, description: "ISO-8601 with an offset. Empty clears it" }))),
  endAt: t.Optional(t.Nullable(t.String({ maxLength: 40, description: "ISO-8601 with an offset, after startAt. Empty clears it" }))),
};

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
  Body: t.Object({ ...Fields, image: t.File({ description: "JPEG, PNG or WebP, up to 5 MB. The real file type is checked, not the extension." }) }, { additionalProperties: false }),
  Response: Envelope(AdminBanner),
};

export const BannerPatch = {
  Params: BannerGet.Params,
  Body: t.Object({ ...t.Partial(t.Object(Fields)).properties, image: t.Optional(t.File({ description: "Replacement image: JPEG, PNG or WebP, up to 5 MB" })) }, { additionalProperties: false }),
  Response: Envelope(AdminBanner),
};

export const BannerDelete = { Params: BannerGet.Params, Response: Envelope(t.Object({ id: t.String({ format: "uuid" }) })) };
