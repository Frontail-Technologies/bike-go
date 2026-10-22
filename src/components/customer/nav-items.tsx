import { CalendarCheckIcon, HouseIcon, MotorcycleIcon, UserIcon } from "@phosphor-icons/react/ssr";

export const customerNav = [
  { href: "/", label: "Home", Icon: HouseIcon },
  { href: "/bikes", label: "Bikes", Icon: MotorcycleIcon },
  { href: "/bookings", label: "Bookings", Icon: CalendarCheckIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
