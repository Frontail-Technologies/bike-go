"use client";

import { useTranslations } from "@/i18n/hooks";

export function LoadingRegion({ className, children }: { className?: string; children: React.ReactNode }) {
  const t = useTranslations("common");

  return (
    <div className={className} role="status" aria-label={t("loading")}>
      {children}
    </div>
  );
}
