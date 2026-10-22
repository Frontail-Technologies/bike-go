export type PageParams = { page?: number | undefined; pageSize?: number | undefined };

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
