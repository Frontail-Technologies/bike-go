"use client";

import { MotorcycleIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  const t = useTranslations("common");

  return (
    <Link
      href={href}
      aria-label={t("logoHome")}
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-ink", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand text-ink">
        <MotorcycleIcon size={20} weight="fill" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">RideGo</span>
    </Link>
  );
}
