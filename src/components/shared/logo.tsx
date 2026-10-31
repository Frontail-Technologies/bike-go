"use client";

import Image from "next/image";
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
      <Image src="/brand/logo.png" alt="" width={40} height={40} priority className="size-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-brand">CAN</span>
        <span className="text-[10px] font-bold tracking-wide text-gold uppercase">Motorbike · Car</span>
      </span>
    </Link>
  );
}
