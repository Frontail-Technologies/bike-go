"use client";

import { GoogleLogoIcon } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BikeArt } from "@/components/shared/bike-art";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";
import { useCustomerAuthMutations, useCustomerSessionQuery } from "./hooks/use-customer-session-query";
import { safeCustomerReturnTo } from "./safe-return-to";
import { TelegramLoginWidget } from "./telegram-login-widget";

const HERO_IMAGE: string | null = "/hero/welcome.jpg";

const slides = ["slide1", "slide2", "slide3", "slide4"] as const;

export function WelcomeScreen() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useCustomerSessionQuery();
  const auth = useCustomerAuthMutations();
  const t = useTranslations("auth");
  const common = useTranslations("common");

  const returnTo = safeCustomerReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    if (session.data) router.replace(returnTo);
  }, [returnTo, router, session.data]);

  async function continueWithGoogle() {
    try {
      await auth.google.mutateAsync(`${window.location.origin}${returnTo}`);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Google sign-in could not be started.");
    }
  }

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
      <div className="absolute inset-0 md:relative md:inset-auto md:min-h-dvh md:flex-1">
        {HERO_IMAGE ? (
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[62%_top]"
          />
        ) : (
          <div className="flex size-full items-end justify-center md:items-center">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 55% at 65% 30%, rgb(255 140 0 / 0.38), transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="relative mb-[46dvh] w-[118%] max-w-[560px] md:mb-0 md:w-4/5"
            >
              <BikeArt
                color="#FFC400"
                className="drop-shadow-[0_24px_40px_rgb(0_0_0/0.5)]"
              />
            </div>
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink via-ink/85 to-transparent md:hidden"
        />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-[calc(1rem+var(--safe-top))] md:justify-start md:px-12">
        <Logo className="text-white" />
      </div>

      <div className="absolute top-0 right-0 z-20 pt-[calc(0.5rem+var(--safe-top))] pr-2 md:pr-8">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="relative z-10 mt-auto flex flex-col gap-6 px-6 pb-[calc(1.5rem+var(--safe-bottom))] md:mt-0 md:w-[520px] md:shrink-0 md:justify-center md:px-12 md:pb-12">
        <div
          ref={emblaRef}
          className="overflow-hidden"
          role="region"
          aria-roledescription={common("carousel")}
          aria-label={t("welcomeAria")}
        >
          <div className="flex touch-pan-y">
            {slides.map((slide, i) => (
              <div
                key={slide}
                role="group"
                aria-roledescription={common("slide")}
                aria-label={t("slideOf", { index: i + 1, total: slides.length })}
                className="flex min-w-0 flex-[0_0_100%] flex-col gap-3"
              >
                <h1 className="text-[2.5rem] leading-[1.02] font-extrabold tracking-tight">
                  <span className="block">{t(`${slide}Line1`)}</span>
                  <span className="block">{t(`${slide}Line2`)}</span>
                  <span className="block text-brand">{t(`${slide}Accent`)}</span>
                </h1>
                <p className="max-w-xs text-base text-white/80">{t(`${slide}Text`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            className="bg-white text-ink hover:bg-white/90"
            isPending={auth.google.isPending}
            isDisabled={auth.google.isPending || auth.telegram.isPending}
            onPress={continueWithGoogle}
          >
            <GoogleLogoIcon size={20} weight="bold" />
            {t("continueGoogle")}
          </Button>
          <TelegramLoginWidget
            onAuth={async (payload) => {
              try {
                await auth.telegram.mutateAsync(payload);
                toast.success(t("welcomeToast"));
                router.replace(returnTo);
              } catch (error) {
                toast.danger(error instanceof Error ? error.message : "Telegram sign-in could not be completed.");
              }
            }}
          />
          <p className="text-center text-xs text-white/60">
            {t.rich("consent", {
              terms: (chunks) => (
                <Link href="/legal/terms" className="font-semibold text-white underline underline-offset-2">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/legal/privacy" className="font-semibold text-white underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>

        <div
          className="flex justify-center gap-0.5"
          role="group"
          aria-label={t("chooseSlide")}
        >
          {slides.map((slide, i) => (
            <button
              key={slide}
              type="button"
              aria-label={t("showSlide", { n: i + 1 })}
              aria-current={i === selected}
              onClick={() => emblaApi?.scrollTo(i)}
              className="group flex h-11 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
                  i === selected
                    ? "w-5 bg-brand"
                    : "w-1.5 bg-white/40 group-hover:bg-white/60",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
