import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { AppError, invalid } from "@/libs/api";
import { db } from "@/libs/db";
import { banners } from "@/libs/db/schema";
import { compact } from "@/libs/object";
import { paginate } from "@/libs/pagination";
import { assertSafeKey } from "@/providers/storage/key";
import { effectiveStatusOf, effectiveStatusSql } from "@/routes/banner/status";
import type { BannerRow } from "@/routes/banner/types";
import type { AdminBannersGet, BannerCreateInput, BannerPatchInput } from "./types";

const view = (row: BannerRow) => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  imageStorageKey: row.imageStorageKey,
  imageUrl: row.imageUrl,
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

function checkWindow(startAt: Date | null | undefined, endAt: Date | null | undefined) {
  if (startAt && endAt && endAt <= startAt) throw invalid("endAt", "The end must be after the start.");
}

function checkKey(key: string | undefined) {
  if (key === undefined) return;
  try {
    assertSafeKey(key);
  } catch {
    throw invalid("imageStorageKey", "The image key must not contain .. or //.");
  }
}

const asDate = (value: string | null | undefined) => (value === undefined ? undefined : value === null ? null : new Date(value));

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

export async function createBanner(input: BannerCreateInput) {
  const startAt = asDate(input.startAt) ?? null;
  const endAt = asDate(input.endAt) ?? null;
  checkWindow(startAt, endAt);
  checkKey(input.imageStorageKey);
  const [created] = await db
    .insert(banners)
    .values({
      title: input.title.trim(),
      subtitle: input.subtitle ?? null,
      imageStorageKey: input.imageStorageKey,
      imageUrl: input.imageUrl ?? null,
      ctaLabel: input.ctaLabel ?? null,
      ctaUrl: input.ctaUrl ?? null,
      placement: input.placement,
      displayOrder: input.displayOrder ?? 0,
      status: input.status ?? "active",
      startAt,
      endAt,
    })
    .returning();
  return view(created!);
}

export async function updateBanner(id: string, patch: BannerPatchInput) {
  const existing = await findOrThrow(id);
  const { startAt: patchStart, endAt: patchEnd, ...rest } = patch;
  const changes = compact({
    ...rest,
    title: rest.title?.trim(),
    startAt: asDate(patchStart),
    endAt: asDate(patchEnd),
  });
  checkWindow("startAt" in changes ? (changes.startAt as Date | null) : existing.startAt, "endAt" in changes ? (changes.endAt as Date | null) : existing.endAt);
  checkKey(patch.imageStorageKey);
  if (Object.keys(changes).length === 0) return view(existing);
  const [updated] = await db.update(banners).set(changes).where(eq(banners.id, id)).returning();
  return view(updated!);
}

export async function deleteBanner(id: string) {
  const [deleted] = await db.delete(banners).where(eq(banners.id, id)).returning({ id: banners.id });
  if (!deleted) throw new AppError("NOT_FOUND", 404, "Banner not found.");
  return deleted;
}
