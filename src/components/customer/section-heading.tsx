"use client";

import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useTranslations } from "@/i18n/hooks";

type SectionHeadingProps = {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({ id, title, href, linkLabel }: SectionHeadingProps) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          {linkLabel ?? t("viewAll")}
          <CaretRightIcon size={14} weight="bold" />
        </Link>
      ) : null}
    </div>
  );
}
