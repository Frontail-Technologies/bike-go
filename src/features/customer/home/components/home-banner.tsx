"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicBanner } from "../types";

export function HomeBanner({ banner }: { banner: PublicBanner }) {
  return (
    <section aria-label={banner.title} className="relative isolate h-52 overflow-hidden rounded-card bg-ink text-white md:h-80 md:rounded-overlay">
      <Image src={banner.imageUrl} alt="" fill priority unoptimized sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover object-center md:object-right" />
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-ink via-ink/75 to-transparent" />
      <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-center gap-2 p-5 md:max-w-lg md:gap-3 md:p-12">
        <p className="text-3xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
          {banner.title}
        </p>
        {banner.subtitle ? <p className="text-xs text-white/80 md:text-lg">{banner.subtitle}</p> : null}
      </div>
    </section>
  );
}

export function HomePromoBanner({ banner }: { banner: PublicBanner }) {
  return (
    <section aria-label={banner.title} className="relative isolate flex min-h-36 items-center overflow-hidden rounded-overlay bg-ink p-5 text-white md:min-h-52 md:p-10">
      <Image src={banner.imageUrl} alt="" fill unoptimized sizes="(min-width: 1280px) 1216px, 100vw" className="-z-20 object-cover object-center md:object-right" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/80 to-ink/15" />
      <div className="flex max-w-[70%] flex-col gap-1 md:max-w-xl md:gap-2">
        <h2 className="text-lg font-extrabold md:text-3xl">{banner.title}</h2>
        {banner.subtitle ? <p className="text-sm text-white/80 md:text-base">{banner.subtitle}</p> : null}
      </div>
      {banner.ctaLabel && banner.ctaUrl ? (
        <Link href={banner.ctaUrl} className="ml-auto flex h-11 shrink-0 items-center rounded-control bg-brand px-4 text-sm font-semibold text-ink outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-white active:scale-[0.97] motion-reduce:transition-none md:h-12 md:px-6 md:text-base">
          {banner.ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
