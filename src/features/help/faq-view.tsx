"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { Accordion } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { faqGroups } from "./faq";

export function FaqView() {
  const open = useSearchParams().get("open");

  return (
    <>
      <AppBar leading="back" backFallback="/help" title="Questions" />
      <Screen enter="slide" className="flex flex-col gap-8 md:max-w-3xl">
        <DesktopTitle title="Questions" subtitle="Quick answers about booking, paying, pickup and riding." />

        {faqGroups.map((group) => (
          <section key={group.id} aria-labelledby={`faq-${group.id}`}>
            <h2 id={`faq-${group.id}`} className="mb-3 text-lg leading-7 font-bold">
              {group.title}
            </h2>
            <Accordion allowsMultipleExpanded defaultExpandedKeys={open ? [open] : []} className="w-full rounded-card border border-line bg-surface px-4 shadow-card">
              {group.items.map((item) => (
                <Accordion.Item key={item.id} id={item.id}>
                  <Accordion.Heading>
                    <Accordion.Trigger className="min-h-14 py-3 text-left text-[15px] leading-6 font-semibold">
                      {item.question}
                      <Accordion.Indicator>
                        <CaretDownIcon size={18} />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="pb-4 text-[15px] leading-7 text-ink/80">{item.answer}</Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </section>
        ))}

        <section aria-label="Still need help" className="flex flex-col gap-3 rounded-card bg-brand-soft p-4">
          <p className="text-base leading-6 font-bold">Still stuck?</p>
          <p className="text-sm leading-6 text-ink/80">Tell us what happened and we will get back to you.</p>
          <ButtonLink href="/help/report" variant="primary">
            Report an issue
          </ButtonLink>
        </section>
      </Screen>
    </>
  );
}
