export type BannerPlacement = "home_hero" | "home_promo" | "vehicles" | "expat_loan";

export type BannerListParams = { placement?: BannerPlacement };

export type PublicBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  placement: BannerPlacement;
  displayOrder: number;
  startAt: string | null;
  endAt: string | null;
};
