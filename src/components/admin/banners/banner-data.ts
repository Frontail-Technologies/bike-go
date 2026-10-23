import { CarProfileIcon, HouseLineIcon, MegaphoneIcon, MotorcycleIcon, type Icon } from "@phosphor-icons/react";
import type { AdminStatus } from "@/components/admin/data-display/status-badge";

export const placements = ["home_hero", "home_promo", "vehicles", "expat_loan"] as const;
export type BannerPlacement = (typeof placements)[number];
export type BannerStoredStatus = "active" | "inactive";
export type BannerTone = "sun" | "night" | "forest" | "rose";
export type BannerArtKind = "scooter" | "motorcycle" | "car";

export type Banner = {
  id: string; title: string; subtitle: string; ctaLabel: string; ctaUrl: string; placement: BannerPlacement; displayOrder: number;
  status: BannerStoredStatus; startAt: string | null; endAt: string | null; imageUrl: string | null; tone: BannerTone; art: BannerArtKind;
};

export type EffectiveStatus = Extract<AdminStatus, "active" | "scheduled" | "inactive" | "expired">;

export const placementMeta: Record<BannerPlacement, { label: string; description: string; hint: string; Icon: Icon; badge: string; tile: string }> = {
  home_hero: { label: "Home Hero", description: "Large banners at the top of the homepage.", hint: "Main hero banners displayed on the homepage (large format).", Icon: HouseLineIcon, badge: "bg-[var(--admin-info-soft)] text-[var(--admin-info)]", tile: "bg-[var(--admin-info-soft)] text-[var(--admin-info)]" },
  home_promo: { label: "Home Promo", description: "Secondary offers below the hero.", hint: "Promotional banners for special offers on the homepage.", Icon: MegaphoneIcon, badge: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]", tile: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" },
  vehicles: { label: "Vehicles", description: "Promotions shown while browsing vehicles.", hint: "Banners shown in the vehicles section.", Icon: MotorcycleIcon, badge: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]", tile: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" },
  expat_loan: { label: "Expat Loan", description: "Loan-related promotions.", hint: "Banners for the expat loan product section.", Icon: CarProfileIcon, badge: "bg-[#efe9ff] text-[#6246c7]", tile: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" },
};

export const NOW = Date.parse("2026-10-23T03:00:00.000Z");

export function effectiveStatus(banner: Pick<Banner, "status" | "startAt" | "endAt">, now = NOW): EffectiveStatus {
  if (banner.status === "inactive") return "inactive";
  if (banner.startAt && Date.parse(banner.startAt) > now) return "scheduled";
  if (banner.endAt && Date.parse(banner.endAt) < now) return "expired";
  return "active";
}

const at = (iso: string) => `${iso}T00:00:00+07:00`;

export const initialBanners: Banner[] = [
  { id: "banner-1", title: "Ride Further with RideGo", subtitle: "Reliable rides across Cambodia", ctaLabel: "Book Now", ctaUrl: "/bikes", placement: "home_hero", displayOrder: 1, status: "active", startAt: at("2026-10-01"), endAt: at("2026-12-31"), imageUrl: "/hero/home-banner.jpg", tone: "sun", art: "scooter" },
  { id: "banner-2", title: "Explore Cambodia", subtitle: "Your journey starts here", ctaLabel: "Explore Bikes", ctaUrl: "/bikes", placement: "home_hero", displayOrder: 2, status: "active", startAt: at("2026-11-01"), endAt: at("2026-11-30"), imageUrl: null, tone: "night", art: "motorcycle" },
  { id: "banner-3", title: "Safe Rides, Happy Journeys", subtitle: "Trusted by thousands every day", ctaLabel: "Learn more", ctaUrl: "/bikes", placement: "home_hero", displayOrder: 3, status: "active", startAt: at("2026-10-15"), endAt: at("2026-12-15"), imageUrl: null, tone: "forest", art: "scooter" },
  { id: "banner-4", title: "Weekend Ride Offers", subtitle: "Save more on 2-day rentals", ctaLabel: "See offers", ctaUrl: "/bikes?offer=weekend", placement: "home_promo", displayOrder: 1, status: "active", startAt: at("2026-10-10"), endAt: at("2026-11-10"), imageUrl: "/hero/offer-banner.jpg", tone: "sun", art: "motorcycle" },
  { id: "banner-5", title: "Discover Phnom Penh", subtitle: "Scooter tours of the capital", ctaLabel: "Plan a ride", ctaUrl: "/bikes?city=phnom-penh", placement: "home_promo", displayOrder: 2, status: "active", startAt: at("2026-08-01"), endAt: at("2026-08-31"), imageUrl: null, tone: "rose", art: "scooter" },
  { id: "banner-6", title: "Explore Our Vehicle Fleet", subtitle: "Scooters, motorcycles and cars", ctaLabel: "Browse fleet", ctaUrl: "/bikes", placement: "vehicles", displayOrder: 1, status: "active", startAt: at("2026-10-15"), endAt: at("2026-12-31"), imageUrl: null, tone: "sun", art: "car" },
  { id: "banner-7", title: "Loans for Expats in Cambodia", subtitle: "Flexible vehicle financing", ctaLabel: "Apply now", ctaUrl: "/loans", placement: "expat_loan", displayOrder: 1, status: "active", startAt: at("2026-10-01"), endAt: null, imageUrl: "/hero/welcome.jpg", tone: "night", art: "car" },
  { id: "banner-8", title: "Low Interest Car Loans", subtitle: "Rates from 0.9% per month", ctaLabel: "Check eligibility", ctaUrl: "https://ridego.com/loans", placement: "expat_loan", displayOrder: 2, status: "inactive", startAt: at("2026-09-01"), endAt: at("2026-12-01"), imageUrl: null, tone: "forest", art: "car" },
];

export const getBanner = (id: string) => initialBanners.find((banner) => banner.id === id);

export const formatSchedule = (banner: Pick<Banner, "startAt" | "endAt">) => {
  const fmt = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  if (!banner.startAt && !banner.endAt) return "Always on";
  return `${banner.startAt ? fmt(banner.startAt) : "Now"} – ${banner.endAt ? fmt(banner.endAt) : "No end"}`;
};

export const renumber = (list: Banner[]): Banner[] =>
  placements.flatMap((placement) => list.filter((banner) => banner.placement === placement).sort((a, b) => a.displayOrder - b.displayOrder).map((banner, index) => ({ ...banner, displayOrder: index + 1 })));
