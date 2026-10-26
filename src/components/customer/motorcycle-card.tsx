"use client";

import { GasPumpIcon, GaugeIcon, HeartIcon, StarIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { PriceDisplay } from "@/components/customer/price-display";
import { InteractiveCard } from "@/components/motion/interactive-card";
import { BikeImage } from "@/components/shared/bike-image";
import { IconButton } from "@/components/ui/button";
import type { Motorcycle } from "@/features/customer/vehicles/lib/view-model";
import { favoritesStore, toggleFavorite } from "@/features/customer/profile/stores/preferences-store";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type MotorcycleCardProps = {
  bike: Motorcycle;
  href?: string | null;
  className?: string;
};

export function MotorcycleCard({ bike, href, className }: MotorcycleCardProps) {
  const favorite = favoritesStore.useValue().includes(bike.id);
  const t = useTranslations("bike");
  const target = href === undefined ? `/bikes/${bike.id}` : href;
  const title = <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-bold">{bike.name}</h3>;

  return (
    <InteractiveCard as="article" glare className={cn("flex h-full flex-col gap-0 overflow-hidden p-0", className)}>
      <div className="relative aspect-4/3 overflow-hidden bg-canvas">
        <BikeImage bike={bike} sizes="(min-width: 1024px) 25vw, 50vw" />
        {!bike.available ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
            {t("onRent")}
          </span>
        ) : null}
        <IconButton
          label={favorite ? t("removeNamed", { name: bike.name }) : t("saveNamed", { name: bike.name })}
          aria-pressed={favorite}
          variant="ghost"
          size="sm"
          onPress={() => toggleFavorite(bike.id)}
          icon={<HeartIcon size={20} weight={favorite ? "fill" : "regular"} className={favorite ? "text-danger" : undefined} />}
          className="absolute top-1 right-1 z-10 bg-surface/80 backdrop-blur-sm"
        />
      </div>
      <div className="flex flex-col gap-1 p-3">
        {target ? (
          <Link
            href={target}
            className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ink"
          >
            {title}
          </Link>
        ) : (
          title
        )}
        <ul className="flex flex-wrap gap-1.5 text-[11px] text-ink">
          <li className="flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5">
            <GaugeIcon size={12} />
            {bike.engineCc}cc
          </li>
          <li className="flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5">
            <GasPumpIcon size={12} />
            {bike.mileageKmpl} km/l
          </li>
        </ul>
        <PriceDisplay amount={bike.pricePerDay} size="sm" accent />
        {bike.reviews > 0 ? <span className="tabular flex items-center gap-1 text-xs font-medium text-subtle">
          <StarIcon size={14} weight="fill" className="text-brand" />
          {bike.rating.toFixed(1)}
          <span className="font-normal">({bike.reviews})</span>
        </span> : null}
      </div>
    </InteractiveCard>
  );
}
