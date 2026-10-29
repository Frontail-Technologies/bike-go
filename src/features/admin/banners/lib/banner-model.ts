import { CarProfileIcon, HouseLineIcon, MegaphoneIcon, MotorcycleIcon, type Icon } from "@phosphor-icons/react";
import { ictLocalToIso, isoToIctLocal } from "@/features/admin/bookings/lib/booking-model";
import type { Banner, BannerFields, BannerPlacement } from "../types/banner";
import type { BannerFormValues } from "../schemas/banner-schemas";
import { formatDate } from "@/lib/date";
import { adminT } from "@/features/admin/i18n/translate";

export const placementMeta: Record<BannerPlacement, { label: string; description: string; hint: string; Icon: Icon; badge: string; tile: string }> = {
  home_hero: { get label() { return adminT("banners.placements.home_hero.label"); }, get description() { return adminT("banners.placements.home_hero.description"); }, get hint() { return adminT("banners.placements.home_hero.hint"); }, Icon: HouseLineIcon, badge: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]", tile: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" },
  home_promo: { get label() { return adminT("banners.placements.home_promo.label"); }, get description() { return adminT("banners.placements.home_promo.description"); }, get hint() { return adminT("banners.placements.home_promo.hint"); }, Icon: MegaphoneIcon, badge: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]", tile: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" },
  vehicles: { get label() { return adminT("banners.placements.vehicles.label"); }, get description() { return adminT("banners.placements.vehicles.description"); }, get hint() { return adminT("banners.placements.vehicles.hint"); }, Icon: MotorcycleIcon, badge: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]", tile: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" },
  expat_loan: { get label() { return adminT("banners.placements.expat_loan.label"); }, get description() { return adminT("banners.placements.expat_loan.description"); }, get hint() { return adminT("banners.placements.expat_loan.hint"); }, Icon: CarProfileIcon, badge: "bg-[#efe9ff] text-[#6246c7]", tile: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" },
};

export const formatSchedule = (banner: Pick<Banner, "startAt" | "endAt">) => {
  const fmt = formatDate;
  if (!banner.startAt && !banner.endAt) return adminT("banners.schedule.always");
  return `${banner.startAt ? fmt(banner.startAt) : adminT("banners.schedule.now")} – ${banner.endAt ? fmt(banner.endAt) : adminT("banners.schedule.noEnd")}`;
};

export const blankBannerForm = (placement: BannerPlacement): BannerFormValues => ({ title: "", subtitle: "", ctaLabel: "", ctaUrl: "", placement, displayOrder: "0", status: "active", startAt: "", endAt: "" });

export const bannerToFormValues = (banner: Banner): BannerFormValues => ({
  title: banner.title, subtitle: banner.subtitle ?? "", ctaLabel: banner.ctaLabel ?? "", ctaUrl: banner.ctaUrl ?? "", placement: banner.placement, displayOrder: String(banner.displayOrder),
  status: banner.status === "inactive" ? "inactive" : banner.status === "scheduled" ? "scheduled" : "active", startAt: banner.startAt ? isoToIctLocal(banner.startAt) : "", endAt: banner.endAt ? isoToIctLocal(banner.endAt) : "",
});

export const formValuesToFields = (values: BannerFormValues): BannerFields => ({
  title: values.title, subtitle: values.subtitle, ctaLabel: values.ctaLabel, ctaUrl: values.ctaUrl, placement: values.placement, displayOrder: Number(values.displayOrder),
  status: values.status, startAt: values.startAt ? ictLocalToIso(values.startAt) : "", endAt: values.endAt ? ictLocalToIso(values.endAt) : "",
});
