export const placements = ["home_hero", "home_promo", "vehicles", "expat_loan"] as const;
export type BannerPlacement = (typeof placements)[number];

export const bannerStatuses = ["active", "scheduled", "inactive", "expired"] as const;
export type BannerStatus = (typeof bannerStatuses)[number];

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  /** Staff-only image address; the storage key is never exposed. */
  imageUrl: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  placement: BannerPlacement;
  displayOrder: number;
  /** What staff stored. */
  status: BannerStatus;
  /** What visitors get right now, derived by the backend from the status and the schedule. */
  effectiveStatus: BannerStatus;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BannerSort = "displayOrder" | "newest" | "oldest" | "title" | "startAt" | "endAt";

export type BannerListParams = {
  page: number;
  pageSize: number;
  q?: string;
  placement?: BannerPlacement;
  /** Effective status, as the backend derives it. */
  status?: BannerStatus;
  sort?: BannerSort;
};
export type BannerListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type BannerFields = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  placement: BannerPlacement;
  displayOrder: number;
  status: Exclude<BannerStatus, "expired">;
  /** ISO-8601 with an offset; empty clears it. */
  startAt: string;
  endAt: string;
};

export type BannerCreateInput = BannerFields & { image: File };
export type BannerUpdateInput = Partial<BannerFields> & { image?: File };
