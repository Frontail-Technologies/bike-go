"use client";

import { ChatCircleDotsIcon, EnvelopeSimpleIcon, FlagIcon, PhoneIcon, QuestionIcon, ReceiptIcon } from "@phosphor-icons/react";
import { AppBar } from "@/components/shared/app-bar";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/i18n/hooks";
import { faqKey, popularFaqIds } from "../lib/faq";

const tileClass =
  "flex min-h-24 flex-col items-center justify-center gap-2 rounded-card border border-line bg-surface p-3 text-center text-sm leading-5 font-semibold shadow-card outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.98] motion-reduce:transition-none";

function Tile({ icon, label, hint }: { icon: React.ReactNode; label: string; hint: string }) {
  return (
    <>
      <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft">{icon}</span>
      <span>
        {label}
        <span className="block text-xs font-normal text-subtle">{hint}</span>
      </span>
    </>
  );
}

export function HelpView() {
  const t = useTranslations("help");

  return (
    <>
      <AppBar leading="back" backFallback="/profile" title={t("title")} />
      <Screen enter="slide" className="flex flex-col gap-6 md:max-w-3xl">
        <DesktopTitle title={t("title")} subtitle={t("subtitle")} />

        <section aria-label={t("contactAria")} className="grid grid-cols-3 gap-3">
          <button type="button" className={tileClass} onClick={() => toast.info(t("supportToast"), { description: t("supportToastDesc") })}>
            <Tile icon={<ChatCircleDotsIcon size={22} />} label={t("chat")} hint={t("fastest")} />
          </button>
          <a href="tel:+911800000000" className={tileClass}>
            <Tile icon={<PhoneIcon size={22} />} label={t("call")} hint={t("always")} />
          </a>
          <a href="mailto:help@ridego.example" className={tileClass}>
            <Tile icon={<EnvelopeSimpleIcon size={22} />} label={t("email")} hint={t("withinDay")} />
          </a>
        </section>

        <SectionCard id="popular-title" title={t("popularQuestions")}>
          {popularFaqIds.map((id) => (
            <ListRow key={id} icon={<QuestionIcon size={20} />} label={t(faqKey(id, "q"))} href={`/help/faq?open=${id}`} />
          ))}
        </SectionCard>

        <SectionCard id="more-title" title={t("moreHelp")}>
          <ListRow icon={<QuestionIcon size={20} />} label={t("allQuestions")} description={t("allQuestionsHint")} href="/help/faq" />
          <ListRow icon={<ReceiptIcon size={20} />} label={t("helpBooking")} description={t("helpBookingHint")} href="/bookings" />
          <ListRow icon={<FlagIcon size={20} />} label={t("reportIssue")} description={t("reportIssueHint")} href="/help/report" />
        </SectionCard>

        <p className={cn("px-1 text-center text-xs leading-5 text-subtle")}>{t("available")}</p>
      </Screen>
    </>
  );
}
