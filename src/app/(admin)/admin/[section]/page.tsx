import { SquaresFourIcon } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";

const sections = {
  bikes: "Fleet",
  bookings: "Bookings",
  customers: "Customers",
  payments: "Payments",
  settings: "Settings",
} as const;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function AdminSectionPlaceholder({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = sections[section as keyof typeof sections];
  if (!title) notFound();

  return (
    <EmptyState
      icon={<SquaresFourIcon size={24} weight="fill" />}
      title={title}
      description="This section is built in a later phase. The admin shell is ready."
    />
  );
}
