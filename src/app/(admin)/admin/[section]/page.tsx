import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

const sections = ["bikes", "loan-applications"] as const;

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  if (section === "bikes") redirect("/admin/vehicles");
  if (section === "loan-applications") redirect("/admin/loans");
  return notFound();
}

export default function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading workspace…" />}><AdminSection params={params} /></Suspense>;
}
