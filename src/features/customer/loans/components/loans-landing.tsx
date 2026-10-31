"use client";

import {
  ArrowRightIcon,
  BankIcon,
  BellIcon,
  BriefcaseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  DeviceMobileIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  HeadsetIcon,
  HouseLineIcon,
  IdentificationCardIcon,
  InfoIcon,
  ListChecksIcon,
  PhoneIcon,
  ReceiptIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Accordion } from "@heroui/react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { AppBar } from "@/components/shared/app-bar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Screen } from "@/components/shared/screen";
import { IconButton } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { useTranslations } from "@/i18n/hooks";
import type { PublicBanner } from "@/features/customer/home/types";
import { type DocumentId, documentTypes } from "../lib/data";
import { LoanCalculator } from "./loan-calculator";
import { LoanOptionsCarousel } from "./loan-options-carousel";
import { useLoanText } from "../lib/use-loan-text";

const why = [
  { Icon: DeviceMobileIcon, key: "why1" },
  { Icon: EyeIcon, key: "why2" },
  { Icon: ListChecksIcon, key: "why3" },
  { Icon: HeadsetIcon, key: "why4" },
] as const;

const requirements = ["req1", "req2", "req3", "req4", "req5", "req6"] as const;

const steps = ["step1", "step2", "step3", "step4"] as const;

const documentIcons: Record<DocumentId, typeof FileTextIcon> = {
  passport: IdentificationCardIcon,
  residence: GlobeIcon,
  employment: BriefcaseIcon,
  income: ReceiptIcon,
  address: HouseLineIcon,
  bank: BankIcon,
};

const faqs = ["faqWho", "faqDocs", "faqTime", "faqFees"] as const;

function Heading({ id, title }: { id: string; title: string }) {
  return (
    <h2 id={id} className="text-lg leading-7 font-bold md:text-xl">
      {title}
    </h2>
  );
}

export function LoansLanding({ banner }: { banner?: PublicBanner }) {
  const t = useTranslations("loans");
  const common = useTranslations("common");
  const { docLabel } = useLoanText();

  return (
    <>
      <AppBar leading="logo" actions={
          <>
            <LanguageSwitcher />
            <IconButton label={common("notifications")} icon={<BellIcon size={24} />} />
          </>
        } />

      <div className="md:mx-auto md:max-w-7xl md:px-page md:pt-8">
        <section
          aria-label={t("overviewAria")}
          className="relative isolate overflow-hidden rounded-b-[32px] bg-ink text-white md:rounded-overlay"
        >
          {banner ? <Image src={banner.imageUrl} alt="" fill priority unoptimized sizes="(min-width: 1280px) 1216px, 100vw" className="-z-20 object-cover object-[78%_top]" /> : null}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/85 to-ink/10 md:bg-linear-to-r md:from-ink md:via-ink/80 md:to-transparent"
          />
          <div className="flex min-h-104 flex-col justify-end gap-3 px-6 pt-40 pb-8 md:min-h-96 md:max-w-xl md:justify-center md:p-12">
            <p className="text-sm font-bold text-brand">{t("eyebrow")}</p>
            <h1 className="max-w-md text-[2rem] leading-[1.1] font-extrabold tracking-tight md:text-5xl">
              {banner?.title ?? t("heroTitle")}
            </h1>
            <p className="max-w-md text-sm text-white/80 md:text-base">
              {banner?.subtitle ?? t("heroText")}
            </p>
            <div className="mt-2 flex max-w-sm flex-col gap-3 md:flex-row">
              <ButtonLink href="/loans/apply" size="lg" fullWidth>
                {t("checkEligibility")}
                <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
              <ButtonLink
                href="#how"
                variant="outline"
                size="lg"
                fullWidth
                className="border-white/70 bg-transparent text-white hover:bg-white/10"
              >
                {t("howItWorks")}
              </ButtonLink>
            </div>
            <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/80">
              <li className="flex items-center gap-1.5">
                <ShieldCheckIcon size={16} className="text-brand" />
                {t("secure")}
              </li>
              <li className="flex items-center gap-1.5">
                <EyeIcon size={16} className="text-brand" />
                {t("transparent")}
              </li>
            </ul>
          </div>
        </section>
      </div>

      <Screen bottom="nav" className="flex flex-col gap-8 md:gap-12">
        <Reveal>
          <section aria-labelledby="types" className="flex flex-col gap-3">
            <Heading id="types" title={t("optionsTitle")} />
            <LoanOptionsCarousel />
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="why" className="flex flex-col gap-3">
            <Heading id="why" title={t("whyTitle")} />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {why.map(({ Icon, key }) => (
                <li
                  key={key}
                  className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-4 text-center"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft">
                    <Icon size={22} />
                  </span>
                  <p className="text-sm font-bold">{t(`${key}Title`)}</p>
                  <p className="text-xs leading-5 text-subtle">{t(`${key}Text`)}</p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <div className="grid gap-8 md:gap-12 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <section
            aria-labelledby="eligibility"
            className="flex flex-col gap-3"
          >
            <Heading id="eligibility" title={t("eligibilityTitle")} />
            <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card md:p-6">
              <p className="text-sm font-bold">{t("generalReq")}</p>
              <ul className="flex flex-col gap-3">
                {requirements.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon
                      size={20}
                      weight="fill"
                      className="shrink-0 text-[#16a34a]"
                    />
                    {t(item)}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/loans/apply" size="lg" fullWidth>
                {t("checkMy")}
                <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
              <p className="flex items-start gap-2 text-xs leading-5 text-subtle">
                <InfoIcon size={16} className="mt-0.5 shrink-0" />
                {t("reqVary")}
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="docs" className="flex flex-col gap-3">
            <Heading id="docs" title={t("docsTitle")} />
            <ul className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
              {documentTypes.map((doc) => {
                const Icon = documentIcons[doc.id];
                return (
                  <li
                    key={doc.id}
                    className="flex min-h-14 items-center gap-3 border-b border-line px-4 last:border-0"
                  >
                    <Icon size={22} className="shrink-0 text-subtle" />
                    <p className="flex-1 text-sm font-medium">{docLabel(doc.id)}</p>
                    <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-[11px] font-semibold text-[#b91c1c]">
                      {common("required")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>

        </div>

        <section aria-labelledby="calc" className="flex flex-col gap-3">
          <Heading id="calc" title={t("calcTitle")} />
          <LoanCalculator />
        </section>

        <Reveal>
          <section
            id="how"
            aria-labelledby="how-title"
            className="flex scroll-mt-20 flex-col gap-3"
          >
            <Heading id="how-title" title={t("howTitle")} />
            <ol className="flex flex-col gap-4 md:grid md:grid-cols-4 md:gap-4">
              {steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-3 md:rounded-card md:border md:border-line md:bg-surface md:p-4"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-brand-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{t(`${step}Title`)}</p>
                    <p className="text-xs leading-5 text-subtle">{t(`${step}Text`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <div className="grid gap-8 md:gap-12 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <section
            aria-label={t("ctaAria")}
            className="flex flex-col gap-4 rounded-overlay bg-ink p-6 text-white md:p-8"
          >
            <h2 className="text-xl leading-7 font-extrabold">
              {t("ctaTitle")}
            </h2>
            <p className="text-sm text-white/80">
              {t("ctaText")}
            </p>
            <div className="flex flex-col gap-3">
              <ButtonLink href="/loans/apply" size="lg" fullWidth>
                {t("startApplication")}
                <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
              <ButtonLink
                href="/help"
                variant="outline"
                size="lg"
                fullWidth
                className="border-white/70 bg-transparent text-white hover:bg-white/10"
              >
                {t("talkSupport")}
              </ButtonLink>
            </div>
          </section>
        </Reveal>

        <div className="flex flex-col gap-8 md:gap-12">
        <Reveal>
          <section
            aria-labelledby="faq"
            className="flex flex-col gap-3"
          >
            <Heading id="faq" title={t("faqTitle")} />
            <Accordion aria-label={t("faqTitle")} className="w-full rounded-card border border-line bg-surface px-4 shadow-card">
              {faqs.map((item) => (
                <Accordion.Item key={item} id={item}>
                  <Accordion.Heading>
                    <Accordion.Trigger className="min-h-14 py-3 text-left text-[15px] leading-6 font-semibold">
                      {t(`${item}Q`)}
                      <Accordion.Indicator>
                        <CaretDownIcon size={18} />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="pb-4 text-[15px] leading-7 text-ink/80">
                      {t(`${item}A`)}
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </section>
        </Reveal>

        <Reveal>
          <section
            aria-label={t("helpAria")}
            className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              <HeadsetIcon size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold">{t("needHelp")}</p>
              <p className="text-xs text-subtle">{t("talkTeam")}</p>
              <a
                href="tel:+911800000000"
                className="tabular flex min-h-11 items-center gap-1 text-sm font-semibold underline underline-offset-2"
              >
                <PhoneIcon size={16} />
                +91 1800 000 000
              </a>
            </div>
          </section>
        </Reveal>
        </div>
        </div>
      </Screen>
    </>
  );
}
