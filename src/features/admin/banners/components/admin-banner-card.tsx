"use client";

import { Button } from "@heroui/react";
import { CalendarBlankIcon, EyeIcon, NotePencilIcon, SortAscendingIcon } from "@phosphor-icons/react";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { formatSchedule } from "../lib/banner-model";
import type { Banner } from "../types/banner";
import { BannerImage } from "./banner-image";
import { BannerActions, type BannerHandlers, PlacementBadge } from "./banner-parts";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function AdminBannerCard({ banner, handlers }: { banner: Banner; handlers: BannerHandlers }) {
  const t = useAdminTranslations();
  return (
    <article className="adminSurface adminLift flex flex-col overflow-hidden rounded-2xl">
      <div className="relative">
        <button type="button" onClick={() => handlers.onPreview(banner)} aria-label={t("banners.card.preview", { name: banner.title })} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--admin-accent-strong)]">
          <BannerImage banner={banner} className="aspect-[16/7] w-full" sizes="(min-width: 1536px) 30vw, (min-width: 768px) 45vw, 100vw" />
        </button>
        <span className="pointer-events-none absolute left-3 top-3"><PlacementBadge placement={banner.placement} className="shadow-sm" /></span>
        <span className="absolute right-1.5 top-1.5 rounded-full bg-white/85 backdrop-blur"><BannerActions banner={banner} handlers={handlers} /></span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-extrabold leading-tight">{banner.title}</h3>
            <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">{banner.subtitle ?? ""}</p>
          </div>
          <AdminStatusBadge status={banner.effectiveStatus} />
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--admin-muted)]">
          <li className="inline-flex items-center gap-1.5"><CalendarBlankIcon size={14} aria-hidden />{formatSchedule(banner)}</li>
          <li className="inline-flex items-center gap-1.5"><SortAscendingIcon size={14} aria-hidden />{t("banners.card.order", { count: banner.displayOrder })}</li>
        </ul>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--admin-border)] pt-3">
          <span className="adminTile truncate rounded-lg px-2.5 py-1 text-xs font-semibold" title={banner.ctaUrl ?? undefined}>{banner.ctaLabel ?? t("banners.card.noButton")}</span>
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" variant="ghost" className="min-h-11 md:min-h-9" onPress={() => handlers.onPreview(banner)}><EyeIcon size={15} />{t("banners.actions.previewShort")}</Button>
            <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" onPress={() => handlers.onEdit(banner)}><NotePencilIcon size={15} />{t("banners.actions.editShort")}</Button>
          </div>
        </div>
      </div>
    </article>
  );
}
