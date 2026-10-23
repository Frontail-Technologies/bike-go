"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { dynamicT } from "./helpers";
import { useTranslations } from "./hooks";

const legalKeys: Record<string, string> = { terms: "terms", privacy: "privacy", "rental-policy": "rentalPolicy" };

const exact: Record<string, string> = {
  "/signin": "auth.signIn",
  "/bikes": "browse.title",
  "/bikes/filters": "browse.filters",
  "/bookings": "booking.myBookings",
  "/profile": "profile.title",
  "/help": "help.title",
  "/help/faq": "help.faqTitle",
  "/help/report": "help.reportTitle",
  "/legal": "legal.title",
  "/loans": "nav.expatLoans",
  "/loans/apply": "loans.applyDesktopTitle",
  "/loans/applications": "profile.applicationsTitle",
};

function titleKey(pathname: string) {
  if (exact[pathname]) return exact[pathname];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "bikes" && parts[2] === "book" && parts.length === 3) return "booking.bookThisBike";
  if (parts[0] === "bookings" && parts.length === 3 && parts[2] === "confirmation") return "booking.confirmed";
  if (parts[0] === "bookings" && parts.length === 2) return "booking.details";
  if (parts[0] === "loans" && parts.length === 2) return "loans.stTitle";
  if (parts[0] === "legal" && parts.length === 2 && legalKeys[parts[1]!]) return `legal.${legalKeys[parts[1]!]}_title`;
  return null;
}

export function DocumentTitle() {
  const pathname = usePathname();
  const t = dynamicT(useTranslations());
  const key = titleKey(pathname);
  const desired = key ? `${t(key)} · RideGo` : null;

  useEffect(() => {
    if (!desired) return;
    const apply = () => {
      if (document.title !== desired) document.title = desired;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [desired]);

  return null;
}
