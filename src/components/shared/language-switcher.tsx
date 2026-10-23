"use client";

import { CheckIcon, GlobeIcon } from "@phosphor-icons/react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { type Locale, localeMeta, locales } from "@/i18n";
import { setAppLocale, useAppLocale, useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type LanguageSwitcherProps = {
  variant?: "icon" | "compact" | "dark";
  className?: string;
};

export function LanguageOptions({ className }: { className?: string }) {
  const locale = useAppLocale();

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {locales.map((code) => {
        const selected = code === locale;
        return (
          <li key={code}>
            <button
              type="button"
              lang={localeMeta[code].lang}
              aria-pressed={selected}
              onClick={() => setAppLocale(code as Locale)}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-3 text-left text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink",
                selected ? "bg-brand-soft font-bold" : "hover:bg-surface-secondary",
              )}
            >
              <span>{localeMeta[code].label}</span>
              {selected ? <CheckIcon size={18} weight="bold" /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function LanguageSwitcher({ variant = "icon", className }: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useAppLocale();
  const dark = variant === "dark";

  return (
    <ResponsiveOverlay
      title={t("chooseLanguage")}
      popoverClassName="w-[240px]"
      triggerProps={{
        variant: dark ? "ghost" : "ghost",
        size: variant === "compact" ? "sm" : "md",
        ...(variant === "icon" ? { isIconOnly: true } : {}),
        "aria-label": `${t("language")}: ${localeMeta[locale].label}`,
        className: cn(dark && "text-white hover:bg-white/10", variant === "compact" && "gap-1 px-2", className),
      }}
      triggerLabel={
        variant === "compact" ? (
          <>
            <GlobeIcon size={20} />
            <span className="text-sm font-semibold">{localeMeta[locale].short}</span>
          </>
        ) : (
          <GlobeIcon size={24} />
        )
      }
    >
      <LanguageOptions />
    </ResponsiveOverlay>
  );
}
