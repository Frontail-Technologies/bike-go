import { CarProfileIcon, HouseLineIcon, MegaphoneIcon, MotorcycleIcon, type Icon } from "@phosphor-icons/react";
import { ictLocalToIso, isoToIctLocal } from "@/features/admin/bookings/lib/booking-model";
import type { Banner, BannerFields, BannerPlacement } from "../types/banner";
import type { BannerFormValues } from "../schemas/banner-schemas";

export const placementMeta: Record<BannerPlacement, { label: string; description: string; hint: string; Icon: Icon; badge: string; tile: string }> = {
  home_hero: { label: "Home Hero", description: "Large banners at the top of the homepage.", hint: "Main hero banners displayed on the homepage (large format).", Icon: HouseLineIcon, badge: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]", tile: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" },
  home_promo: { label: "Home Promo", description: "Secondary offers below the hero.", hint: "Promotional banners for special offers on the homepage.", Icon: MegaphoneIcon, badge: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]", tile: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" },
  vehicles: { label: "Vehicles", description: "Promotions shown while browsing vehicles.", hint: "Banners shown in the vehicles section.", Icon: MotorcycleIcon, badge: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]", tile: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" },
  expat_loan: { label: "Expat Loan", description: "Loan-related promotions.", hint: "Banners for the expat loan product section.", Icon: CarProfileIcon, badge: "bg-[#efe9ff] text-[#6246c7]", tile: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" },
};

export const formatSchedule = (banner: Pick<Banner, "startAt" | "endAt">) => {
  const fmt = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  if (!banner.startAt && !banner.endAt) return "Always on";
  return `${banner.startAt ? fmt(banner.startAt) : "Now"} – ${banner.endAt ? fmt(banner.endAt) : "No end"}`;
};

export const blankBannerForm = (placement: BannerPlacement): BannerFormValues => ({ title: "", subtitle: "", ctaLabel: "", ctaUrl: "", placement, displayOrder: "0", status: "active", startAt: "", endAt: "" });

/** Expired is derived and cannot be chosen, so an expired banner edits as active until its dates change. */
export const bannerToFormValues = (banner: Banner): BannerFormValues => ({
  title: banner.title, subtitle: banner.subtitle ?? "", ctaLabel: banner.ctaLabel ?? "", ctaUrl: banner.ctaUrl ?? "", placement: banner.placement, displayOrder: String(banner.displayOrder),
  status: banner.status === "inactive" ? "inactive" : banner.status === "scheduled" ? "scheduled" : "active", startAt: banner.startAt ? isoToIctLocal(banner.startAt) : "", endAt: banner.endAt ? isoToIctLocal(banner.endAt) : "",
});

export const formValuesToFields = (values: BannerFormValues): BannerFields => ({
  title: values.title, subtitle: values.subtitle, ctaLabel: values.ctaLabel, ctaUrl: values.ctaUrl, placement: values.placement, displayOrder: Number(values.displayOrder),
  status: values.status, startAt: values.startAt ? ictLocalToIso(values.startAt) : "", endAt: values.endAt ? ictLocalToIso(values.endAt) : "",
});
