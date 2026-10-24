"use client";

import { Modal } from "@heroui/react";
import { useState } from "react";
import { ViewToggle } from "@/components/admin/controls";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { cn } from "@/lib/cn";
import { formatSchedule, placementMeta } from "../lib/banner-model";
import { placements, type Banner, type BannerPlacement } from "../types/banner";
import { BannerImage } from "./banner-image";
import { PlacementBadge } from "./banner-parts";

function Cta({ banner, className }: { banner: Banner; className?: string }) {
  return <span className={cn("inline-flex min-h-8 items-center rounded-lg bg-[#111820] px-3 text-xs font-bold text-white", className)}>{banner.ctaLabel ?? ""}</span>;
}

function Frame({ placement, banner }: { placement: BannerPlacement; banner: Banner }) {
  const text = (
    <div className="absolute inset-y-0 left-0 flex w-3/5 flex-col justify-center gap-1.5 bg-gradient-to-r from-[#08131b]/85 via-[#08131b]/45 to-transparent p-4 text-white sm:p-6">
      <p className="text-base font-extrabold leading-tight sm:text-2xl">{banner.title}</p>
      {banner.subtitle ? <p className="text-xs text-white/80 sm:text-sm">{banner.subtitle}</p> : null}
      {banner.ctaLabel ? <Cta banner={banner} className="mt-1 w-fit bg-[var(--admin-accent)] text-[#111820]" /> : null}
    </div>
  );
  if (placement === "home_hero") {
    return <div className="relative overflow-hidden rounded-2xl"><BannerImage banner={banner} textless className="aspect-[16/6] w-full" sizes="640px" />{text}</div>;
  }
  if (placement === "home_promo") {
    return (
      <div className="space-y-3">
        <div className="adminTile h-10 rounded-xl" aria-hidden />
        <div className="relative overflow-hidden rounded-2xl"><BannerImage banner={banner} textless className="aspect-[16/6] w-full" sizes="640px" />{text}</div>
        <div className="grid grid-cols-2 gap-3" aria-hidden><div className="adminTile h-16 rounded-xl" /><div className="adminTile h-16 rounded-xl" /></div>
      </div>
    );
  }
  if (placement === "vehicles") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 relative overflow-hidden rounded-2xl"><BannerImage banner={banner} textless className="aspect-[16/5] w-full" sizes="640px" />{text}</div>
        {[0, 1].map((slot) => <div key={slot} className="adminTile h-20 rounded-xl" aria-hidden />)}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="adminSurface flex items-center gap-3 rounded-2xl p-3" aria-hidden><div className="size-10 rounded-xl bg-[var(--admin-surface-muted)]" /><div className="flex-1 space-y-1.5"><div className="h-2.5 w-1/2 rounded bg-[var(--admin-surface-muted)]" /><div className="h-2 w-1/3 rounded bg-[var(--admin-surface-muted)]" /></div></div>
      <div className="relative overflow-hidden rounded-2xl"><BannerImage banner={banner} textless className="aspect-[16/7] w-full" sizes="640px" />{text}</div>
    </div>
  );
}

function PreviewBody({ banner }: { banner: Banner }) {
  const [placement, setPlacement] = useState<BannerPlacement>(banner.placement);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{banner.title}</p>
        <PlacementBadge placement={banner.placement} />
        <AdminStatusBadge status={banner.effectiveStatus} />
      </div>
      <div className="overflow-x-auto"><ViewToggle label="Preview placement" value={placement} onChange={setPlacement} options={placements.map((value) => ({ value, label: placementMeta[value].label, icon: null }))} /></div>
      <div className="adminTile rounded-2xl p-3 sm:p-4"><Frame placement={placement} banner={banner} /></div>
      <p className="text-xs text-[var(--admin-muted)]">Contextual frame only, not the live page. Schedule: {formatSchedule(banner)} (ICT). {banner.ctaUrl ? <>Links to <span className="font-semibold text-[var(--admin-text)]">{banner.ctaUrl}</span>.</> : null}</p>
    </>
  );
}

export function BannerPreview({ banner, isOpen, onOpenChange }: { banner: Banner | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="lg">
        <Modal.Dialog aria-label="Banner preview">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Banner preview</Modal.Heading></Modal.Header>
          <Modal.Body className="space-y-4">{banner ? <PreviewBody key={banner.id} banner={banner} /> : null}</Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
