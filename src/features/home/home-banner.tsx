"use client";

import Image from "next/image";
import { BikeArt } from "@/components/shared/bike-art";
import { useTranslations } from "@/i18n/hooks";
import type { PublicBanner } from "./types";

const BANNER_IMAGE: string | null = "/hero/home-banner.jpg";

export function HomeBanner({ banner }: { banner?: PublicBanner }) {
  const t = useTranslations("home");

  return (
    <section aria-label={t("welcomeAria")} className="relative isolate h-52 overflow-hidden rounded-card bg-ink text-white md:h-80 md:rounded-overlay">
      {banner?.imageUrl || BANNER_IMAGE ? (
        <Image src={banner?.imageUrl ?? BANNER_IMAGE!} alt="" fill priority unoptimized={Boolean(banner?.imageUrl)} sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover object-right" />
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "radial-gradient(60% 90% at 78% 35%, rgb(255 140 0 / 0.42), transparent 70%)" }}
          />
          <div aria-hidden className="absolute -right-10 bottom-0 w-[62%] max-w-md md:right-8 md:w-1/2">
            <BikeArt color="#FFC400" className="p-0 drop-shadow-[0_18px_28px_rgb(0_0_0/0.5)]" />
          </div>
        </>
      )}
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-ink via-ink/75 to-transparent" />
      <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-center gap-2 p-5 md:max-w-lg md:gap-3 md:p-12">
        <p className="text-3xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
          {banner?.title ?? t("bannerLine1")}
          {!banner ? <span className="block text-brand">{t("bannerLine2")}</span> : null}
        </p>
        <p className="text-xs text-white/80 md:text-lg">{banner?.subtitle ?? t("bannerSub")}</p>
      </div>
    </section>
  );
}
