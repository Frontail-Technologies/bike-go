"use client";

import { MapPinIcon, PhoneIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { cities } from "@/features/mock/data";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

const columns = [
  {
    title: "explore",
    links: [
      { label: "home", href: "/" },
      { label: "bikes", href: "/bikes" },
      { label: "myBookings", href: "/bookings" },
      { label: "expatLoans", href: "/loans" },
      { label: "profile", href: "/profile" },
    ],
  },
  {
    title: "support",
    links: [
      { label: "helpCenter", href: "/help" },
      { label: "questions", href: "/help/faq" },
      { label: "reportIssue", href: "/help/report" },
    ],
  },
  {
    title: "legal",
    links: [
      { label: "terms", href: "/legal/terms" },
      { label: "privacy", href: "/legal/privacy" },
      { label: "rentalPolicy", href: "/legal/rental-policy" },
    ],
  },
] as const;

const linkClass =
  "inline-flex min-h-8 items-center rounded-control text-sm leading-6 text-ink/75 outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink";

export function SiteFooter({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const places = useTranslations("places");

  return (
    <footer data-site-footer className={cn("hidden border-t border-line bg-surface md:block", className)}>
      <div className="mx-auto grid max-w-7xl gap-10 px-page py-12 md:grid-cols-[1.4fr_repeat(3,1fr)_1fr]">
        <div className="flex flex-col gap-3">
          <Logo className="-ml-1 self-start" />
          <p className="max-w-xs text-sm leading-6 text-ink/75">{t("tagline")}</p>
          <a href="tel:+911800000000" className={cn(linkClass, "gap-2 self-start font-semibold text-ink")}>
            <PhoneIcon size={18} />
            1800 000 000
          </a>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={t(column.title)}>
            <h2 className="mb-2 text-sm leading-6 font-bold">{t(column.title)}</h2>
            <ul className="flex flex-col">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="mb-2 text-sm leading-6 font-bold">{t("pickupCities")}</h2>
          <ul className="flex flex-col">
            {cities.map((city) => (
              <li key={city} className="flex min-h-8 items-center gap-2 text-sm leading-6 text-ink/75">
                <MapPinIcon size={16} weight="fill" className="shrink-0" />
                {places(`cities.${city}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-page py-4 text-xs leading-5 text-subtle">
          <p>{t("copyright")}</p>
          <p>{t("supportHours")}</p>
        </div>
      </div>
    </footer>
  );
}
