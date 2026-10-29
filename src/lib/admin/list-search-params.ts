export type AdminListState = {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const positiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function readAdminListState(searchParams: URLSearchParams, defaults: Pick<AdminListState, "pageSize">): AdminListState {
  const sortOrder = searchParams.get("sortOrder");
  return {
    page: positiveInt(searchParams.get("page"), 1),
    pageSize: positiveInt(searchParams.get("pageSize"), defaults.pageSize),
    search: searchParams.get("search") ?? "",
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
  };
}

export function writeAdminListState(current: URLSearchParams, state: Partial<AdminListState>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) next.delete(key);
    else next.set(key, String(value));
  }
  return next;
}
