import {
  BuildingsIcon,
  CalendarCheckIcon,
  CarProfileIcon,
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
  adminName: "Sophea Admin",
  adminRole: "Super Admin",
} as const;

export const adminNavigation = [
  { href: "/admin", label: "Dashboard", Icon: SquaresFourIcon },
  { href: "/admin/vehicles", label: "Vehicles", Icon: CarProfileIcon },
  { href: "/admin/banners", label: "Banners", Icon: ImagesSquareIcon },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheckIcon },
  { href: "/admin/customers", label: "Customers", Icon: UsersIcon },
  { href: "/admin/admins", label: "Admin Users", Icon: UserGearIcon, superAdminOnly: true },
  { href: "/admin/loans", label: "Loan Applications", Icon: HandCoinsIcon },
  { href: "/admin/documents", label: "Documents", Icon: FileTextIcon },
  { href: "/admin/payments", label: "Payments", Icon: CreditCardIcon },
  { href: "/admin/locations", label: "Locations", Icon: BuildingsIcon },
  { href: "/admin/settings", label: "Settings", Icon: GearIcon },
] as const;
