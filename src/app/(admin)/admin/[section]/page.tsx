import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { DocumentList } from "@/components/admin/documents/document-list";
import { SettingsView } from "@/components/admin/settings/settings-view";
import { PaymentList } from "@/components/admin/payments/payment-list";
import { CustomerList } from "@/components/admin/customers/customer-list";
import { BookingList } from "@/components/admin/bookings/booking-list";

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
  if (section === "loan-applications") redirect("/admin/loans");
  if (section === "documents") return <DocumentList />;
  if (section === "payments") return <PaymentList />;
  return <SettingsView />;
}

export default function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading workspace…" />}><AdminSection params={params} /></Suspense>;
}
