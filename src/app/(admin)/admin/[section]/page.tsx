import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { CustomerList } from "@/components/admin/customers/customer-list";
import { BookingList } from "@/components/admin/bookings/booking-list";
import { DocumentsScreen, LoansScreen, PaymentsScreen, SettingsScreen } from "@/components/admin/operations/operation-screens";

const sections = ["bookings", "customers", "loan-applications", "documents", "payments", "settings"] as const;

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "bikes") redirect("/admin/vehicles");
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  if (section === "bookings") return <BookingList />;
  if (section === "customers") return <CustomerList />;
  if (section === "loan-applications") return <LoansScreen />;
  if (section === "documents") return <DocumentsScreen />;
  if (section === "payments") return <PaymentsScreen />;
  return <SettingsScreen />;
}

export default function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading workspace…" />}><AdminSection params={params} /></Suspense>;
}
