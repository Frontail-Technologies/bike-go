"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BikeArt } from "@/components/shared/bike-art";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { AuthDialog, type AuthMode } from "./auth-dialog";

/** Drop a photo at public/hero/welcome.webp and set this to "/hero/welcome.webp" to replace the artwork. */
const HERO_IMAGE: string | null = null;

const slides = [
  { lines: ["EXPLORE", "ON TWO"], accent: "WHEELS", text: "Premium bikes. Flexible rentals. Unforgettable journeys." },
  { lines: ["PICK YOUR", "PERFECT"], accent: "RIDE", text: "Cruisers, sports and adventure bikes, ready in your city." },
  { lines: ["BOOK IN", "A FEW"], accent: "MINUTES", text: "Choose dates, pay once and pick up at a hub near you." },
  { lines: ["RIDE WITH", "TOTAL"], accent: "CONFIDENCE", text: "Verified bikes, a refundable deposit and 24/7 support." },
];

export function WelcomeScreen() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const [dialog, setDialog] = useState<AuthMode | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <main
      id="main"
      className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ink text-white md:flex-row-reverse"
    >
      {/* Artwork: a photo when one is provided, otherwise the placeholder bike on a warm glow. */}
      <div className="relative flex min-h-[46dvh] flex-1 items-end justify-center md:min-h-dvh md:items-center">
        {HERO_IMAGE ? (
          <Image src={HERO_IMAGE} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "radial-gradient(70% 55% at 65% 30%, rgb(255 140 0 / 0.38), transparent 70%)" }}
            />
            <div aria-hidden className="relative w-[118%] max-w-[560px] -translate-y-2 md:w-4/5 md:translate-y-0">
              <BikeArt color="#FFC400" className="drop-shadow-[0_24px_40px_rgb(0_0_0/0.5)]" />
            </div>
          </>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-ink to-transparent md:hidden" />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-[calc(1rem+var(--safe-top))] md:justify-start md:px-12">
        <Logo className="text-white" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 px-6 pb-[calc(1.5rem+var(--safe-bottom))] md:w-[520px] md:shrink-0 md:justify-center md:px-12 md:pb-12">
        <div ref={emblaRef} className="overflow-hidden" role="region" aria-roledescription="carousel" aria-label="Welcome">
          <div className="flex touch-pan-y">
            {slides.map((slide, i) => (
              <div
                key={slide.accent}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                className="flex min-w-0 flex-[0_0_100%] flex-col gap-3"
              >
                <h1 className="text-[2.5rem] leading-[1.02] font-extrabold tracking-tight">
                  {slide.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  <span className="block text-brand">{slide.accent}</span>
                </h1>
                <p className="max-w-xs text-base text-white/80">{slide.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" fullWidth onPress={() => setDialog("signup")}>
            Get Started
            <ArrowRightIcon size={20} weight="bold" />
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="outline"
            className="border-white/70 bg-transparent text-white hover:bg-white/10"
            onPress={() => setDialog("signin")}
          >
            Sign In
          </Button>
        </div>

        <div className="flex justify-center gap-0.5" role="group" aria-label="Choose a slide">
          {slides.map((slide, i) => (
            <button
              key={slide.accent}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === selected}
              onClick={() => emblaApi?.scrollTo(i)}
              className="group flex h-11 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
                  i === selected ? "w-5 bg-brand" : "w-1.5 bg-white/40 group-hover:bg-white/60",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <AuthDialog mode={dialog} onClose={() => setDialog(null)} />
    </main>
  );
}
