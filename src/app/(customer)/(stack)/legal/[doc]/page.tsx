import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, legalDocs } from "@/features/legal/content";
import { LegalDocument } from "@/features/legal/legal-views";

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ doc: doc.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  return { title: getLegalDoc(doc)?.title ?? "Legal" };
}

export default async function LegalDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const found = getLegalDoc(doc);
  if (!found) notFound();
  return <LegalDocument doc={found} />;
}
