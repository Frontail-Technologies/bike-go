"use client";

import { ArrowRightIcon, MotorcycleIcon, SirenIcon, WalletIcon } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { type LoanTypeId, loanTypes } from "./data";
import { useLoanText } from "./use-loan-text";

const icons: Record<LoanTypeId, React.ReactNode> = {
  personal: <WalletIcon size={30} weight="fill" />,
  vehicle: <MotorcycleIcon size={30} weight="fill" />,
  emergency: <SirenIcon size={30} weight="fill" />,
};

/**
 * Loan options as one card each: a rail that runs to the screen edges on phones (the next card peeks in)
 * with pager dots; from 768px the three cards sit in a grid.
 */
export function LoanOptionsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState(0);
  const { t, typeName, typeDesc } = useLoanText();
  const common = useTranslations("common");

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList().length);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const frame = requestAnimationFrame(sync);
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      cancelAnimationFrame(frame);
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={emblaRef} className="-mx-4 overflow-hidden px-4 md:mx-0 md:px-0" role="region" aria-roledescription={common("carousel")} aria-label={t("optionsAria")}>
        <ul className="flex gap-3 md:grid md:grid-cols-3 md:gap-4">
          {loanTypes.map((type) => (
            <li key={type.id} className="w-[46%] min-w-0 shrink-0 sm:w-[34%] md:w-auto">
              <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-[#b45309]">{icons[type.id]}</span>
                <div>
                  <p className="text-base leading-5 font-bold">{typeName(type.id)}</p>
                  <p className="tabular mt-1 text-sm text-subtle">{t("upTo", { amount: formatPrice(type.maxAmount) })}</p>
                  <p className="text-xs leading-5 text-subtle">{typeDesc(type.id)}</p>
                </div>
                <Link
                  href={`/loans/apply?type=${type.id}`}
                  className="mt-auto flex min-h-11 items-center gap-1 text-sm font-bold text-[#b45309] outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  {t("viewDetails")}
                  <ArrowRightIcon size={14} weight="bold" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {snaps > 1 ? (
        <div className="flex justify-center gap-1 md:hidden" role="group" aria-label={t("chooseOption")}>
          {Array.from({ length: snaps }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("showOption", { n: i + 1 })}
              aria-current={i === selected}
              onClick={() => emblaApi?.scrollTo(i)}
              className="group flex h-6 w-5 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span className={cn("h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none", i === selected ? "w-5 bg-brand" : "w-1.5 bg-line")} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
