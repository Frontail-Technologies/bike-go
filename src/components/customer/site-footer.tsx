import { MapPinIcon, PhoneIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { cities } from "@/features/mock/data";
import { cn } from "@/lib/cn";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Bikes", href: "/bikes" },
      { label: "My bookings", href: "/bookings" },
      { label: "Profile", href: "/profile" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Questions", href: "/help/faq" },
      { label: "Report an issue", href: "/help/report" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Rental and cancellation policy", href: "/legal/rental-policy" },
    ],
  },
] as const;

const linkClass =
  "inline-flex min-h-8 items-center rounded-control text-sm leading-6 text-ink/75 outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink";

/**
 * Website footer for 768px and up. Phones are app-like (bottom nav, no footer), so it is hidden there.
 * Pass extra bottom padding when a screen pins a bar to the bottom edge on tablets.
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer data-site-footer className={cn("hidden border-t border-line bg-surface md:block", className)}>
      <div className="mx-auto grid max-w-7xl gap-10 px-page py-12 md:grid-cols-[1.4fr_repeat(3,1fr)_1fr]">
        <div className="flex flex-col gap-3">
          <Logo className="-ml-1 self-start" />
          <p className="max-w-xs text-sm leading-6 text-ink/75">Premium motorcycle rentals, with flexible bookings and pickup hubs across Rajasthan.</p>
          <a href="tel:+911800000000" className={cn(linkClass, "gap-2 self-start font-semibold text-ink")}>
            <PhoneIcon size={18} />
            1800 000 000
          </a>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-2 text-sm leading-6 font-bold">{column.title}</h2>
            <ul className="flex flex-col">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="mb-2 text-sm leading-6 font-bold">Pickup cities</h2>
          <ul className="flex flex-col">
            {cities.map((city) => (
              <li key={city} className="flex min-h-8 items-center gap-2 text-sm leading-6 text-ink/75">
                <MapPinIcon size={16} weight="fill" className="shrink-0" />
                {city}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-page py-4 text-xs leading-5 text-subtle">
          <p>© 2026 RideGo. All rights reserved.</p>
          <p>Support is available every day, 24 hours.</p>
        </div>
      </div>
    </footer>
  );
}
