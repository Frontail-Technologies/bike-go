import { SquaresFourIcon } from "@phosphor-icons/react/ssr";
import { notFound, redirect } from "next/navigation";
import { AdminEmptyState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";

const sections = {
  vehicles: "Vehicles",
  bookings: "Bookings",
  customers: "Customers",
  "loan-applications": "Loan Applications",
  documents: "Documents",
  payments: "Payments",
  locations: "Locations",
  settings: "Settings",
} as const;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function AdminSectionPlaceholder({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "bikes") redirect("/admin/vehicles");
  const title = sections[section as keyof typeof sections];
  if (!title) notFound();

  return <AdminPage><PageHeader title={title} /><ContentSection><AdminEmptyState title={`${title} workspace`} description="This section is ready for feature-specific screens in a later phase." action={<span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"><SquaresFourIcon size={20} weight="fill" /></span>} /></ContentSection></AdminPage>;
}
