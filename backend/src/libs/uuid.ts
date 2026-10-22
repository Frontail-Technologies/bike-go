import { eq, type AnyColumn, type SQL } from "drizzle-orm";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_PATTERN.test(value);

export function matchIdOrSlug(idColumn: AnyColumn, slugColumn: AnyColumn, value: string): SQL {
  return isUuid(value) ? eq(idColumn, value) : eq(slugColumn, value);
}
