"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { Accordion } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { useTranslations } from "@/i18n/hooks";
import { faqGroups, faqKey } from "./faq";

export function FaqView() {
  const open = useSearchParams().get("open");
  const t = useTranslations("help");

  return (
    <>
      <AppBar leading="back" backFallback="/help" title={t("faqTitle")} />
      <Screen enter="slide" className="flex flex-col gap-8 md:max-w-3xl">
        <DesktopTitle title={t("faqTitle")} subtitle={t("faqSubtitle")} />

        {faqGroups.map((group) => (
          <section key={group.id} aria-labelledby={`faq-${group.id}`}>
            <h2 id={`faq-${group.id}`} className="mb-3 text-lg leading-7 font-bold">
              {t(group.title)}
            </h2>
            <Accordion allowsMultipleExpanded defaultExpandedKeys={open ? [open] : []} className="w-full rounded-card border border-line bg-surface px-4 shadow-card">
              {group.items.map((id) => (
                <Accordion.Item key={id} id={id}>
                  <Accordion.Heading>
                    <Accordion.Trigger className="min-h-14 py-3 text-left text-[15px] leading-6 font-semibold">
                      {t(faqKey(id, "q"))}
                      <Accordion.Indicator>
                        <CaretDownIcon size={18} />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="pb-4 text-[15px] leading-7 text-ink/80">{t(faqKey(id, "a"))}</Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </section>
        ))}

        <section aria-label={t("stillNeedAria")} className="flex flex-col gap-3 rounded-card bg-brand-soft p-4">
          <p className="text-base leading-6 font-bold">{t("stillStuck")}</p>
          <p className="text-sm leading-6 text-ink/80">{t("stillStuckText")}</p>
          <ButtonLink href="/help/report" variant="primary">
            {t("reportIssue")}
          </ButtonLink>
        </section>
      </Screen>
    </>
  );
}
