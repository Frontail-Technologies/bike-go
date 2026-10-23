"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/shared/logo";
import { IconButton } from "@/components/ui/button";
import { useBack } from "@/hooks/use-back";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type AppBarProps = {
  title?: string;
  subtitle?: React.ReactNode;
  leading?: "back" | "logo" | "none";
  backFallback?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  floating?: boolean;
  solid?: boolean;
  titleAs?: "h1" | "p";
  className?: string;
};

export function AppBar({ title, subtitle, leading = "none", backFallback = "/", onBack, actions, floating = false, solid = true, titleAs = "h1", className }: AppBarProps) {
  const back = useBack(backFallback);
  const t = useTranslations("common");
  const overHero = floating && !solid;
  const Title = titleAs;

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-30 pt-[var(--safe-top)] transition-colors duration-200 motion-reduce:transition-none md:hidden",
        floating ? "fixed" : "sticky",
        overHero ? "bg-transparent" : "border-b border-line bg-surface/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        {leading === "back" ? (
          <IconButton
            label={t("goBack")}
            icon={<ArrowLeftIcon size={24} />}
            className={cn("shrink-0", overHero && "bg-surface/90 shadow-card backdrop-blur-sm")}
            onPress={onBack ?? back}
          />
        ) : null}
        {leading === "logo" ? <Logo className="pl-2" /> : null}

        {title ? (
          <div className={cn("min-w-0 flex-1 px-1 transition-opacity duration-200 motion-reduce:transition-none", leading === "none" && "pl-2", overHero && "opacity-0")}>
            <Title className="truncate text-lg leading-6 font-bold" aria-hidden={overHero || undefined}>
              {title}
            </Title>
            {subtitle ? <p className="truncate text-xs text-subtle">{subtitle}</p> : null}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
    </header>
  );
}
