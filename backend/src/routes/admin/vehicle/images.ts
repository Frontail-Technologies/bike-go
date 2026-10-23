import { invalid } from "@/libs/api";

export function parseIdList(field: string, value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  let list: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return [];
    try {
      list = trimmed.startsWith("[") ? JSON.parse(trimmed) : trimmed.split(",").map((part) => part.trim()).filter(Boolean);
    } catch {
      throw invalid(field, "Send a JSON array of image ids or comma-separated ids.");
    }
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!Array.isArray(list) || !list.every((item) => typeof item === "string" && uuid.test(item))) throw invalid(field, "Every entry must be an image id.");
  if (new Set(list).size !== list.length) throw invalid(field, "Image ids must not repeat.");
  return list as string[];
}

export function parseSpecifications(value: string | Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = value.trim() === "" ? {} : JSON.parse(value);
    } catch {
      throw invalid("specifications", "Send a JSON object.");
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw invalid("specifications", "Send a JSON object.");
  return parsed as Record<string, unknown>;
}

export const blankToNull = <T extends string>(value: T | null | undefined) => (value === undefined ? undefined : value === null || value.trim() === "" ? null : value);

export function primaryFirst<T>(items: T[], primaryIndex: number | undefined) {
  if (primaryIndex === undefined || primaryIndex < 0 || primaryIndex >= items.length) return items;
  return [items[primaryIndex]!, ...items.filter((_, index) => index !== primaryIndex)];
}

export type ImagePlan = { existing: { id: string; sortOrder: number }[]; remove: string[]; order: string[] | undefined; primaryId: string | undefined; newIds: string[]; primaryIndex: number | undefined };

export function planImages(plan: ImagePlan) {
  const known = new Set(plan.existing.map((image) => image.id));
  const removing = new Set(plan.remove);

  for (const id of plan.remove) if (!known.has(id)) throw invalid("removeImageIds", "That image does not belong to this vehicle.");
  for (const id of plan.order ?? []) {
    if (!known.has(id)) throw invalid("imageOrder", "That image does not belong to this vehicle.");
    if (removing.has(id)) throw invalid("imageOrder", "An image that is being removed cannot be ordered.");
  }
  if (plan.primaryId !== undefined) {
    if (plan.primaryIndex !== undefined) throw invalid("primaryImageId", "Choose either primaryImageId or primaryImageIndex, not both.");
    if (!known.has(plan.primaryId) || removing.has(plan.primaryId)) throw invalid("primaryImageId", "The primary image must be one of this vehicle's remaining images.");
  }
  if (plan.primaryIndex !== undefined && plan.primaryIndex >= plan.newIds.length) throw invalid("primaryImageIndex", "There is no new image at that position.");

  const remaining = plan.existing.filter((image) => !removing.has(image.id)).sort((a, b) => a.sortOrder - b.sortOrder).map((image) => image.id);
  const listed = (plan.order ?? []).filter((id) => remaining.includes(id));
  const ordered = [...listed, ...remaining.filter((id) => !listed.includes(id)), ...plan.newIds];

  const primary = plan.primaryId ?? (plan.primaryIndex !== undefined ? plan.newIds[plan.primaryIndex] : undefined);
  return primary ? [primary, ...ordered.filter((id) => id !== primary)] : ordered;
}
