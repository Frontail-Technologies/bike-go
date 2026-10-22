import { FileTextIcon, ReceiptIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { AppBar } from "@/components/shared/app-bar";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { type LegalDoc, legalDocs } from "./content";

const icons = {
  terms: <FileTextIcon size={20} />,
  privacy: <ShieldCheckIcon size={20} />,
  "rental-policy": <ReceiptIcon size={20} />,
} as const;

export function LegalHub() {
  return (
    <>
      <AppBar leading="back" backFallback="/profile" title="Legal" />
      <Screen enter="slide" className="flex flex-col gap-6 md:max-w-3xl">
        <DesktopTitle title="Legal" subtitle="The policies behind every rental." />
        <SectionCard id="policies-title" title="Policies">
          {legalDocs.map((doc) => (
            <ListRow key={doc.id} icon={icons[doc.id as keyof typeof icons]} label={doc.title} description={doc.summary} href={`/legal/${doc.id}`} />
          ))}
        </SectionCard>
        <p className="px-1 text-center text-xs leading-5 text-subtle">Sample policy text for this preview. Questions? Contact support from Help.</p>
      </Screen>
    </>
  );
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <AppBar leading="back" backFallback="/legal" title={doc.title} />
      <Screen enter="slide" className="flex flex-col gap-8 md:max-w-3xl">
        <DesktopTitle title={doc.title} subtitle={`Last updated ${doc.updated}`} />
        <p className="text-sm leading-6 text-subtle md:hidden">Last updated {doc.updated}</p>

        <nav aria-label="In this document" className="rounded-card border border-line bg-surface p-4">
          <p className="mb-2 text-sm leading-5 font-bold">In this document</p>
          <ol className="flex flex-col">
            {doc.sections.map((section, index) => (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className="flex min-h-11 items-center gap-3 rounded-control px-1 text-sm leading-5 font-medium outline-none hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <span className="tabular w-5 text-subtle">{index + 1}</span>
                  {section.heading}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <article className="flex flex-col gap-8">
          {doc.sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-20">
              <h2 id={`${section.id}-heading`} className="mb-3 text-lg leading-7 font-bold">
                <span className="tabular mr-2 text-subtle">{index + 1}.</span>
                {section.heading}
              </h2>
              <div className="flex flex-col gap-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-7 text-ink/80">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </Screen>
    </>
  );
}
