import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { AppError, invalid } from "@/libs/api";
import { db } from "@/libs/db";
import { banners } from "@/libs/db/schema";
import { compact } from "@/libs/object";
import { paginate } from "@/libs/pagination";
import { inspectImage } from "@/libs/uploads/inspect";
import { PRIVATE_IMAGE_CACHE, storedImageResponse } from "@/libs/uploads/respond";
import { commitOrDiscard, discardQuietly, uploadAll } from "@/libs/uploads/storage";
import { bannerImagePath } from "@/routes/banner/service";
import { effectiveStatusOf, effectiveStatusSql } from "@/routes/banner/status";
import type { BannerRow } from "@/routes/banner/types";
import type { AdminBannersGet, BannerCreateInput, BannerPatchInput } from "./types";

const view = (row: BannerRow) => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  imageUrl: bannerImagePath(row, "admin"),
  ctaLabel: row.ctaLabel,
  ctaUrl: row.ctaUrl,
  placement: row.placement,
  displayOrder: row.displayOrder,
  status: row.status,
  effectiveStatus: effectiveStatusOf(row),
  startAt: row.startAt?.toISOString() ?? null,
  endAt: row.endAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

async function findOrThrow(id: string) {
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Banner not found.");
  return row;
}

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function parseMoment(field: "startAt" | "endAt", value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const moment = new Date(value);
  if (!ISO_DATE_TIME.test(value) || Number.isNaN(moment.getTime())) throw invalid(field, "Use an ISO-8601 date and time with an offset, for example 2026-11-01T10:00:00+07:00.");
  return moment;
}

const blankToNull = (value: string | null | undefined) => (value === undefined ? undefined : value === null || value.trim() === "" ? null : value);

function checkWindow(startAt: Date | null | undefined, endAt: Date | null | undefined) {
  if (startAt && endAt && endAt <= startAt) throw invalid("endAt", "The end must be after the start.");
}

const imageKey = (id: string, extension: string) => `banners/${id}/${crypto.randomUUID()}.${extension}`;

export async function adminListBanners(query: AdminBannersGet["Query"]) {
  const search = query.q ? `%${query.q.replace(/[\\%_]/g, "\\$&")}%` : undefined;
  const where = and(
    query.placement ? eq(banners.placement, query.placement) : undefined,
    query.status ? eq(effectiveStatusSql, query.status) : undefined,
    search ? or(ilike(banners.title, search), ilike(banners.subtitle, search)) : undefined,
  );
  const order = {
    displayOrder: [asc(banners.displayOrder), asc(banners.createdAt)],
    newest: [desc(banners.createdAt)],
    oldest: [asc(banners.createdAt)],
    title: [asc(banners.title)],
    startAt: [asc(banners.startAt), asc(banners.createdAt)],
    endAt: [asc(banners.endAt), asc(banners.createdAt)],
  }[query.sort ?? "displayOrder"];

  return paginate(query, {
    rows: (page) =>
      db
        .select()
        .from(banners)
        .where(where)
        .orderBy(...order, asc(banners.id))
        .limit(page.limit)
        .offset(page.offset),
    total: () => db.select({ n: count() }).from(banners).where(where),
    map: (rows) => rows.map(view),
  });
}

export async function adminGetBanner(id: string) {
  return view(await findOrThrow(id));
}

export async function adminBannerImage(id: string) {
  const row = await findOrThrow(id);
  return storedImageResponse(row.imageStorageKey, row.imageContentType, PRIVATE_IMAGE_CACHE);
}

export async function createBanner(input: BannerCreateInput) {
  const startAt = parseMoment("startAt", input.startAt) ?? null;
  const endAt = parseMoment("endAt", input.endAt) ?? null;
  checkWindow(startAt, endAt);
  const upload = await inspectImage(input.image, "image");

  const id = crypto.randomUUID();
  const key = imageKey(id, upload.extension);
  await uploadAll([{ key, upload }]);
  const created = await commitOrDiscard([key], async () => {
    const [row] = await db
      .insert(banners)
      .values({
        id,
        title: input.title.trim(),
        subtitle: blankToNull(input.subtitle) ?? null,
        imageStorageKey: key,
        imageContentType: upload.contentType,
        ctaLabel: blankToNull(input.ctaLabel) ?? null,
        ctaUrl: blankToNull(input.ctaUrl) ?? null,
        placement: input.placement,
        displayOrder: input.displayOrder ?? 0,
        status: input.status ?? "active",
        startAt,
        endAt,
      })
      .returning();
    return row!;
  });
  return view(created);
}

export async function updateBanner(id: string, patch: BannerPatchInput) {
  const existing = await findOrThrow(id);
  const { image, startAt: patchStart, endAt: patchEnd, ...rest } = patch;
  const startAt = parseMoment("startAt", patchStart);
  const endAt = parseMoment("endAt", patchEnd);
  checkWindow(startAt === undefined ? existing.startAt : startAt, endAt === undefined ? existing.endAt : endAt);
  const upload = image ? await inspectImage(image, "image") : undefined;

  const changes = compact({
    ...rest,
    title: rest.title?.trim(),
    subtitle: blankToNull(rest.subtitle),
    ctaLabel: blankToNull(rest.ctaLabel),
    ctaUrl: blankToNull(rest.ctaUrl),
    startAt,
    endAt,
  });
  if (!upload && Object.keys(changes).length === 0) return view(existing);

  const key = upload ? imageKey(id, upload.extension) : undefined;
  if (upload && key) await uploadAll([{ key, upload }]);
  const updated = await commitOrDiscard(key ? [key] : [], async () => {
    const [row] = await db
      .update(banners)
      .set({ ...changes, ...(upload && key ? { imageStorageKey: key, imageContentType: upload.contentType } : {}), updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    if (!row) throw new AppError("NOT_FOUND", 404, "Banner not found.");
    return row;
  });
  if (key) await discardQuietly([existing.imageStorageKey]);
  return view(updated);
}

export async function deleteBanner(id: string) {
  const [deleted] = await db.delete(banners).where(eq(banners.id, id)).returning({ id: banners.id, key: banners.imageStorageKey });
  if (!deleted) throw new AppError("NOT_FOUND", 404, "Banner not found.");
  await discardQuietly([deleted.key]);
  return { id: deleted.id };
}
