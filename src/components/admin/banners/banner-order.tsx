"use client";

import { Button } from "@heroui/react";
import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, DotsSixVerticalIcon, PlusIcon } from "@phosphor-icons/react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { cn } from "@/lib/cn";
import { BannerImage } from "./banner-image";
import { type Banner, type BannerPlacement, effectiveStatus, formatSchedule, placementMeta, placements, renumber } from "./banner-data";
import { BannerActions, type BannerHandlers } from "./banner-parts";

function OrderRow({ banner, index, count, handlers, onMove }: { banner: Banner; index: number; count: number; handlers: BannerHandlers; onMove: (direction: -1 | 1) => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={banner} dragListener={false} dragControls={controls} className="adminTile relative flex items-center gap-2 rounded-xl bg-white p-2 sm:gap-3 sm:p-3" whileDrag={{ scale: 1.01, boxShadow: "0 12px 28px -12px rgb(20 25 31 / 30%)", zIndex: 5 }}>
      <button type="button" aria-label={`Drag to reorder ${banner.title}`} onPointerDown={(event) => controls.start(event)} className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-[var(--admin-muted)] outline-none hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] active:cursor-grabbing"><DotsSixVerticalIcon size={22} weight="bold" /></button>
      <BannerImage banner={banner} textless className="h-12 w-20 shrink-0 rounded-lg sm:h-14 sm:w-28" sizes="112px" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{banner.title}</p>
        <p className="truncate text-xs text-[var(--admin-muted)]">{banner.subtitle}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1"><AdminStatusBadge status={effectiveStatus(banner)} /><span className="text-xs text-[var(--admin-muted)]">{formatSchedule(banner)}</span></div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-0.5 max-sm:hidden"><span className="text-[10px] font-medium text-[var(--admin-muted)]">Display order</span><span className="flex size-9 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white text-sm font-extrabold" aria-label={`Position ${index + 1}`}>{index + 1}</span></div>
      <div className="flex shrink-0 flex-col sm:flex-row">
        <Button isIconOnly size="sm" variant="ghost" className="size-9 min-w-9 sm:size-11 sm:min-w-11" aria-label={`Move ${banner.title} up`} isDisabled={index === 0} onPress={() => onMove(-1)}><ArrowUpIcon size={16} /></Button>
        <Button isIconOnly size="sm" variant="ghost" className="size-9 min-w-9 sm:size-11 sm:min-w-11" aria-label={`Move ${banner.title} down`} isDisabled={index === count - 1} onPress={() => onMove(1)}><ArrowDownIcon size={16} /></Button>
      </div>
      <BannerActions banner={banner} handlers={handlers} className="max-sm:hidden" />
    </Reorder.Item>
  );
}

function Group({ placement, items, handlers, onReorder }: { placement: BannerPlacement; items: Banner[]; handlers: BannerHandlers; onReorder: (placement: BannerPlacement, next: Banner[]) => void }) {
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();
  const meta = placementMeta[placement];
  const Icon = meta.Icon;
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(placement, next);
  };
  return (
    <section aria-label={meta.label} className="adminSurface overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 p-3 sm:p-4">
        <button type="button" aria-expanded={open} aria-controls={`order-${placement}`} onClick={() => setOpen((value) => !value)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.tile)}><Icon size={20} weight="duotone" aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{meta.label}</span><span className="block truncate text-xs text-[var(--admin-muted)]">{meta.hint}</span></span>
          <span className="shrink-0 text-xs font-semibold text-[var(--admin-muted)]">{items.length} {items.length === 1 ? "banner" : "banners"}</span>
          <CaretDownIcon size={16} className={cn("shrink-0 text-[var(--admin-muted)] transition-transform", open && "rotate-180", reduce && "transition-none")} aria-hidden />
        </button>
        <Link href={`/admin/banners/new?placement=${placement}`} className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-white px-3 text-xs font-bold outline-none hover:border-[var(--admin-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] sm:inline-flex"><PlusIcon size={14} />Add Banner</Link>
      </header>
      {open ? (
        <div id={`order-${placement}`} className="border-t border-[var(--admin-border)] p-3 sm:p-4">
          {items.length ? (
            <Reorder.Group axis="y" values={items} onReorder={(next) => onReorder(placement, next)} className="space-y-2" aria-label={`${meta.label} banners in display order`}>
              {items.map((banner, index) => <OrderRow key={banner.id} banner={banner} index={index} count={items.length} handlers={handlers} onMove={(direction) => move(index, direction)} />)}
            </Reorder.Group>
          ) : <p className="py-6 text-center text-sm text-[var(--admin-muted)]">No banners in this placement yet.</p>}
        </div>
      ) : null}
    </section>
  );
}

export function BannerOrder({ banners, onChange, handlers }: { banners: Banner[]; onChange: (next: Banner[]) => void; handlers: BannerHandlers }) {
  function reorder(placement: BannerPlacement, next: Banner[]) {
    const others = banners.filter((banner) => banner.placement !== placement);
    onChange(renumber([...others, ...next.map((banner, index) => ({ ...banner, displayOrder: index + 1 }))]));
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--admin-muted)]">Drag the handle (or use the arrows) to change the display order within each placement. <span className="font-semibold">Demo only — order changes reset after reload.</span></p>
      {placements.map((placement) => (
        <Group key={placement} placement={placement} items={banners.filter((banner) => banner.placement === placement).sort((a, b) => a.displayOrder - b.displayOrder)} handlers={handlers} onReorder={reorder} />
      ))}
    </div>
  );
}
