"use client";

import { HeartIcon, StarIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { PriceDisplay } from "@/components/customer/price-display";
import { InteractiveCard } from "@/components/motion/interactive-card";
import { BikeArt } from "@/components/shared/bike-art";
import { IconButton } from "@/components/ui/button";
import type { Motorcycle } from "@/features/mock/data";
import { cn } from "@/lib/cn";

type MotorcycleCardProps = {
  bike: Motorcycle;
  href?: string;
  className?: string;
  defaultFavorite?: boolean;
};

export function MotorcycleCard({ bike, href, className, defaultFavorite = false }: MotorcycleCardProps) {
  const [favorite, setFavorite] = useState(defaultFavorite);
  const title = <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-bold">{bike.name}</h3>;

  return (
    <InteractiveCard as="article" glare className={cn("flex h-full flex-col gap-3 p-3", className)}>
      <div className="relative aspect-4/3 overflow-hidden rounded-control bg-canvas">
        <BikeArt color={bike.color} title={bike.name} className="p-2" />
        <IconButton
          label={favorite ? `Remove ${bike.name} from saved` : `Save ${bike.name}`}
          aria-pressed={favorite}
          variant="ghost"
          size="sm"
          onPress={() => setFavorite((v) => !v)}
          icon={<HeartIcon size={20} weight={favorite ? "fill" : "regular"} className={favorite ? "text-danger" : undefined} />}
          className="absolute top-1 right-1 z-10 bg-surface/80 backdrop-blur-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        {href ? (
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ink"
          >
            {title}
          </Link>
        ) : (
          title
        )}
        <div className="flex items-center justify-between gap-2">
          <PriceDisplay amount={bike.pricePerDay} size="sm" />
          <span className="tabular flex items-center gap-1 text-xs font-medium text-subtle">
            <StarIcon size={14} weight="fill" className="text-brand" />
            {bike.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </InteractiveCard>
  );
}
