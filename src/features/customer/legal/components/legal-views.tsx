"use client";

import { FileTextIcon, ReceiptIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { AppBar } from "@/components/shared/app-bar";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { dynamicT } from "@/i18n/helpers";
import { useTranslations } from "@/i18n/hooks";
import { type LegalDoc, legalDocs } from "../lib/content";

const icons = {
  terms: <FileTextIcon size={20} />,
  privacy: <ShieldCheckIcon size={20} />,
  "rental-policy": <ReceiptIcon size={20} />,
} as const;

export function LegalHub() {
  const t = dynamicT(useTranslations("legal"));

  return (
    <>
      <AppBar leading="back" backFallback="/profile" title={t("title")} />
      <Screen enter="slide" className="flex flex-col gap-6 md:max-w-3xl">
        <DesktopTitle title={t("title")} subtitle={t("subtitle")} />
        <SectionCard id="policies-title" title={t("policies")}>
          {legalDocs.map((doc) => (
            <ListRow key={doc.id} icon={icons[doc.id as keyof typeof icons]} label={t(`${doc.key}_title`)} description={t(`${doc.key}_summary`)} href={`/legal/${doc.id}`} />
          ))}
        </SectionCard>
        <p className="px-1 text-center text-xs leading-5 text-subtle">{t("sample")}</p>
      </Screen>
    </>
  );
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  const t = dynamicT(useTranslations("legal"));
  const updated = t("lastUpdated", { date: t("updated") });

  return (
    <>
      <AppBar leading="back" backFallback="/legal" title={t(`${doc.key}_title`)} />
      <Screen enter="slide" className="flex flex-col gap-8 md:max-w-3xl">
        <DesktopTitle title={t(`${doc.key}_title`)} subtitle={updated} />
        <p className="text-sm leading-6 text-subtle md:hidden">{updated}</p>

        <nav aria-label={t("inThisDocument")} className="rounded-card border border-line bg-surface p-4">
          <p className="mb-2 text-sm leading-5 font-bold">{t("inThisDocument")}</p>
          <ol className="flex flex-col">
            {doc.sections.map((section, index) => (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className="flex min-h-11 items-center gap-3 rounded-control px-1 text-sm leading-5 font-medium outline-none hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <span className="tabular w-5 text-subtle">{index + 1}</span>
                  {t(`${doc.key}_${section.key}_h`)}
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
                {t(`${doc.key}_${section.key}_h`)}
              </h2>
              <div className="flex flex-col gap-3">
                {Array.from({ length: section.paragraphs }, (_, n) => (
                  <p key={n} className="text-[15px] leading-7 text-ink/80">
                    {t(`${doc.key}_${section.key}_p${n + 1}`)}
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
