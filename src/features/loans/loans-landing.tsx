"use client";

import {
  ArrowRightIcon,
  BankIcon,
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
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AppBar } from "@/components/shared/app-bar";
import { Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDay } from "@/features/bookings/dates";
import { formatPrice } from "@/lib/format";
import { type DocumentId, documentTypes, getLoanType } from "./data";
import { LoanCalculator } from "./loan-calculator";
import { LoanOptionsCarousel } from "./loan-options-carousel";
import { LoanStatusBadge } from "./loan-status-badge";
import { loansStore } from "./store";

const why = [
  { Icon: DeviceMobileIcon, title: "Easy application", text: "100% online process" },
  { Icon: EyeIcon, title: "Transparent process", text: "Clear terms and charges" },
  { Icon: ListChecksIcon, title: "Application tracking", text: "Track your status anytime" },
  { Icon: HeadsetIcon, title: "Dedicated support", text: "Help when you need it" },
];

const requirements = [
  "Valid passport",
  "Valid visa / residence permit",
  "Minimum age 21 years",
  "Local employment or income proof",
  "Active bank account",
  "Minimum monthly income requirement",
];

const steps = [
  { title: "Check eligibility", text: "Tell us a few details to see your options." },
  { title: "Submit details", text: "Fill in your personal and employment information." },
  { title: "Upload documents", text: "Share the required documents securely." },
  { title: "Review and approval", text: "We review your application and update you." },
];

const documentIcons: Record<DocumentId, typeof FileTextIcon> = {
  passport: IdentificationCardIcon,
  residence: GlobeIcon,
  employment: BriefcaseIcon,
  income: ReceiptIcon,
  address: HouseLineIcon,
  bank: BankIcon,
};

const faqs = [
  { id: "who", question: "Who can apply for an expat loan?", answer: "Residents aged 21 to 60 with a valid visa or residence permit, a regular income and an active bank account." },
  { id: "docs", question: "What documents are required?", answer: "Passport, visa or residence permit, employment proof, salary slips or income proof, address proof and a bank statement." },
  { id: "time", question: "How long does it take?", answer: "Most applications are reviewed in 1 to 2 working days. You can follow every step in the app." },
  { id: "fees", question: "Are there any fees?", answer: "The monthly payment shown in the calculator already includes interest. Any processing fee is shown before you submit." },
];

function Heading({ id, title }: { id: string; title: string }) {
  return (
    <h2 id={id} className="text-lg leading-7 font-bold md:text-xl">
      {title}
    </h2>
  );
}

export function LoansLanding() {
  const applications = loansStore.useValue();

  return (
    <>
      <AppBar leading="back" backFallback="/" title="Expat loan" />

      {/* Edge to edge on phones, flush under the app bar with rounded bottom corners; a contained card from 768px. */}
      <div className="md:mx-auto md:max-w-7xl md:px-page md:pt-8">
        <section aria-label="Overview" className="relative isolate overflow-hidden rounded-b-[32px] bg-ink text-white md:rounded-overlay">
          <Image src="/hero/home-banner.jpg" alt="" fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="-z-20 object-cover object-[78%_top]" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/85 to-ink/10 md:bg-linear-to-r md:from-ink md:via-ink/80 md:to-transparent" />
          <div className="flex min-h-[26rem] flex-col justify-end gap-3 px-6 pt-40 pb-8 md:min-h-[24rem] md:max-w-xl md:justify-center md:p-12">
            <p className="text-sm font-bold text-brand">Expat Loan</p>
            <h1 className="max-w-md text-[2rem] leading-[1.1] font-extrabold tracking-tight md:text-5xl">Loans made simpler for expats</h1>
            <p className="max-w-md text-sm text-white/80 md:text-base">Check your options and submit your application in a few simple steps.</p>
            <div className="mt-2 flex max-w-sm flex-col gap-3 md:flex-row">
              <ButtonLink href="/loans/apply" size="lg" fullWidth>
                Check eligibility
                <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
              <ButtonLink href="#how" variant="outline" size="lg" fullWidth className="border-white/70 bg-transparent text-white hover:bg-white/10">
                How it works
              </ButtonLink>
            </div>
            <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/80">
              <li className="flex items-center gap-1.5">
                <ShieldCheckIcon size={16} className="text-brand" />
                Secure application
              </li>
              <li className="flex items-center gap-1.5">
                <EyeIcon size={16} className="text-brand" />
                Transparent process
              </li>
            </ul>
          </div>
        </section>
      </div>

      <Screen bottom="nav" className="flex flex-col gap-8 md:gap-12">

        {applications.length > 0 ? (
          <section aria-labelledby="mine" className="flex flex-col gap-3">
            <Heading id="mine" title="Your applications" />
            <ul className="grid gap-3 md:grid-cols-2">
              {applications.map((a) => (
                <li key={a.reference}>
                  <Link
                    href={`/loans/${a.reference}`}
                    className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-card outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.99] motion-reduce:transition-none"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{getLoanType(a.loanType)?.name}</p>
                      <LoanStatusBadge status={a.status} />
                    </div>
                    <p className="tabular text-sm text-subtle">
                      {formatPrice(a.amount)} · {a.tenure} months · {a.reference}
                    </p>
                    <p className="text-xs text-subtle">Applied {formatDay(a.createdAt.slice(0, 10))}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Reveal>
          <section aria-labelledby="types" className="flex flex-col gap-3">
            <Heading id="types" title="Loan options" />
            <LoanOptionsCarousel />
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="why" className="flex flex-col gap-3">
            <Heading id="why" title="Why choose RideGo Expat Loan" />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {why.map(({ Icon, title, text }) => (
                <li key={title} className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-4 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft">
                    <Icon size={22} />
                  </span>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="text-xs leading-5 text-subtle">{text}</p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="eligibility" className="flex flex-col gap-3">
            <Heading id="eligibility" title="Eligibility highlights" />
            <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card md:max-w-xl md:p-6">
              <p className="text-sm font-bold">General requirements</p>
              <ul className="flex flex-col gap-3">
                {requirements.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-[#16a34a]" />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/loans/apply" size="lg" fullWidth>
                Check my eligibility
                <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
              <p className="flex items-start gap-2 text-xs leading-5 text-subtle">
                <InfoIcon size={16} className="mt-0.5 shrink-0" />
                Requirements may vary based on lender and loan type.
              </p>
            </div>
          </section>
        </Reveal>

        <section aria-labelledby="calc" className="flex flex-col gap-3">
          <Heading id="calc" title="Loan calculator" />
          <LoanCalculator />
        </section>

        <Reveal>
          <section id="how" aria-labelledby="how-title" className="flex scroll-mt-20 flex-col gap-3">
            <Heading id="how-title" title="How it works" />
            <ol className="flex flex-col gap-4 md:grid md:grid-cols-4 md:gap-4">
              {steps.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3 md:rounded-card md:border md:border-line md:bg-surface md:p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="text-xs leading-5 text-subtle">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="docs" className="flex flex-col gap-3">
            <Heading id="docs" title="Required documents" />
            <ul className="overflow-hidden rounded-card border border-line bg-surface shadow-card md:max-w-xl">
              {documentTypes.map((doc) => {
                const Icon = documentIcons[doc.id];
                return (
                  <li key={doc.id} className="flex min-h-14 items-center gap-3 border-b border-line px-4 last:border-0">
                    <Icon size={22} className="shrink-0 text-subtle" />
                    <p className="flex-1 text-sm font-medium">{doc.label}</p>
                    <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-[11px] font-semibold text-[#b91c1c]">Required</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section aria-label="Start your application" className="flex flex-col gap-4 rounded-overlay bg-ink p-6 text-white md:max-w-xl md:p-8">
            <h2 className="text-xl leading-7 font-extrabold">Ready to check your options?</h2>
            <p className="text-sm text-white/80">Start your application and get one step closer to your goals.</p>
            <div className="flex flex-col gap-3">
              <ButtonLink href="/loans/apply" size="lg" fullWidth>
                Start application
                <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
              <ButtonLink href="/help" variant="outline" size="lg" fullWidth className="border-white/70 bg-transparent text-white hover:bg-white/10">
                Talk to support
              </ButtonLink>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="faq" className="flex flex-col gap-3 md:max-w-xl">
            <Heading id="faq" title="Frequently asked questions" />
            <Accordion className="w-full rounded-card border border-line bg-surface px-4 shadow-card">
              {faqs.map((item) => (
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
        </Reveal>

        <Reveal>
          <section aria-label="Need help" className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card md:max-w-xl">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              <HeadsetIcon size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold">Need help?</p>
              <p className="text-xs text-subtle">Talk to our support team</p>
              <a href="tel:+911800000000" className="tabular flex min-h-11 items-center gap-1 text-sm font-semibold underline underline-offset-2">
                <PhoneIcon size={16} />
                +91 1800 000 000
              </a>
            </div>
          </section>
        </Reveal>
      </Screen>
    </>
  );
}
