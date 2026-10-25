import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, legalDocs } from "@/features/customer/legal/lib/content";
import { LegalDocument } from "@/features/customer/legal/components/legal-views";
import legal from "@/i18n/messages/legal";

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ doc: doc.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const found = getLegalDoc(doc);
  return { title: found ? legal.en[`${found.key}_title`] : legal.en.title };
}

export default async function LegalDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const found = getLegalDoc(doc);
  if (!found) notFound();
  return <LegalDocument doc={found} />;
}
