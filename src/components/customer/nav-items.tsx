import { features } from "@/lib/features";
import { CalendarCheckIcon, HouseIcon, MotorcycleIcon, UserIcon } from "@phosphor-icons/react/ssr";

export const customerNav = [
  { href: "/", key: "home", Icon: HouseIcon },
  { href: "/bikes", key: "bikes", Icon: MotorcycleIcon },
  { href: "/bookings", key: "bookings", Icon: CalendarCheckIcon },
  { href: "/profile", key: "profile", Icon: UserIcon },
] as const;

export const headerNav = [...customerNav.slice(0, 3), ...(features.loans ? [{ href: "/loans", key: "loans" } as const] : []), customerNav[3]];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
