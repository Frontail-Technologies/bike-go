import type { Icon } from "@phosphor-icons/react";
import {
  BuildingsIcon,
  CalendarCheckIcon,
  CarProfileIcon,
  ChatCircleTextIcon,
  CreditCardIcon,
  FileTextIcon,
  GearIcon,
  HandCoinsIcon,
  ImagesSquareIcon,
  SquaresFourIcon,
  UsersIcon,
  UserGearIcon,
} from "@phosphor-icons/react";

export const adminCopy = {
  productName: "RideGo",
  portalName: "Admin Portal",
  searchPlaceholder: "Search anything…",
} as const;

export type AdminNavKey = "dashboard" | "vehicles" | "banners" | "bookings" | "customers" | "admins" | "loans" | "documents" | "payments" | "feedback" | "locations" | "settings";
export type AdminNavItem = { href: string; label: string; labelKey: AdminNavKey; Icon: Icon; superAdminOnly?: boolean };

export const adminNavigation: ReadonlyArray<AdminNavItem> = [
  { href: "/admin", label: "Dashboard", labelKey: "dashboard", Icon: SquaresFourIcon },
  { href: "/admin/vehicles", label: "Vehicles", labelKey: "vehicles", Icon: CarProfileIcon },
  { href: "/admin/banners", label: "Banners", labelKey: "banners", Icon: ImagesSquareIcon },
  { href: "/admin/bookings", label: "Bookings", labelKey: "bookings", Icon: CalendarCheckIcon },
  { href: "/admin/customers", label: "Customers", labelKey: "customers", Icon: UsersIcon },
  { href: "/admin/admins", label: "Admin Users", labelKey: "admins", Icon: UserGearIcon, superAdminOnly: true },
  { href: "/admin/loans", label: "Loan Applications", labelKey: "loans", Icon: HandCoinsIcon },
  { href: "/admin/documents", label: "Documents", labelKey: "documents", Icon: FileTextIcon },
  { href: "/admin/payments", label: "Payments", labelKey: "payments", Icon: CreditCardIcon },
  { href: "/admin/feedback", label: "Feedback", labelKey: "feedback", Icon: ChatCircleTextIcon },
  { href: "/admin/locations", label: "Locations", labelKey: "locations", Icon: BuildingsIcon },
  { href: "/admin/settings", label: "Settings", labelKey: "settings", Icon: GearIcon },
];
