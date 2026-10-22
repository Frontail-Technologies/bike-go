import { MotorcycleIcon } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";

const sections = {
  bikes: "Bikes",
  bookings: "Bookings",
  profile: "Profile",
} as const;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function SectionPlaceholder({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = sections[section as keyof typeof sections];
  if (!title) notFound();

  return (
    <EmptyState
      icon={<MotorcycleIcon size={24} weight="fill" />}
      title={title}
      description="This page is built in a later phase. The shell and navigation are ready."
    />
  );
}
