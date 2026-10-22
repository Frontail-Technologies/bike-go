import type { Page, PageParams } from "./types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function pageOf({ page, pageSize }: PageParams) {
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize ?? DEFAULT_PAGE_SIZE)));
  const current = Math.max(1, Math.floor(page ?? 1));
  return { page: current, pageSize: size, limit: size, offset: (current - 1) * size };
}

export function pageMeta(params: { page: number; pageSize: number }, total: number) {
  return { page: params.page, pageSize: params.pageSize, total, totalPages: Math.max(1, Math.ceil(total / params.pageSize)) };
}

export async function paginate<Row, Item>(
  query: PageParams,
  source: { rows: (page: Page) => Promise<Row[]>; total: () => Promise<{ n: number }[]>; map: (rows: Row[]) => Item[] | Promise<Item[]> },
) {
  const page = pageOf(query);
  const [found, counted] = await Promise.all([source.rows(page), source.total()]);
  return { data: await source.map(found), meta: pageMeta(page, counted[0]?.n ?? 0) };
}
