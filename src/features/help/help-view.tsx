"use client";

import { ChatCircleDotsIcon, EnvelopeSimpleIcon, FlagIcon, PhoneIcon, QuestionIcon, ReceiptIcon } from "@phosphor-icons/react";
import { AppBar } from "@/components/shared/app-bar";
import { ListRow, SectionCard } from "@/components/shared/list-row";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { faqGroups, popularFaqIds } from "./faq";

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

const popular = popularFaqIds
  .map((id) => faqGroups.flatMap((g) => g.items).find((item) => item.id === id))
  .filter((item): item is NonNullable<typeof item> => Boolean(item));

export function HelpView() {
  return (
    <>
      <AppBar leading="back" backFallback="/profile" title="Help and support" />
      <Screen enter="slide" className="flex flex-col gap-6 md:max-w-3xl">
        <DesktopTitle title="Help and support" subtitle="We usually reply in under 2 minutes, day or night." />

        <section aria-label="Contact us" className="grid grid-cols-3 gap-3">
          <button type="button" className={tileClass} onClick={() => toast.info("Support will join in a moment", { description: "Typical reply: under 2 minutes." })}>
            <Tile icon={<ChatCircleDotsIcon size={22} />} label="Chat" hint="Fastest" />
          </button>
          <a href="tel:+911800000000" className={tileClass}>
            <Tile icon={<PhoneIcon size={22} />} label="Call" hint="24/7" />
          </a>
          <a href="mailto:help@ridego.example" className={tileClass}>
            <Tile icon={<EnvelopeSimpleIcon size={22} />} label="Email" hint="Within a day" />
          </a>
        </section>

        <SectionCard id="popular-title" title="Popular questions">
          {popular.map((item) => (
            <ListRow key={item.id} icon={<QuestionIcon size={20} />} label={item.question} href={`/help/faq?open=${item.id}`} />
          ))}
        </SectionCard>

        <SectionCard id="more-title" title="More help">
          <ListRow icon={<QuestionIcon size={20} />} label="All questions" description="Booking, payments, pickup and riding" href="/help/faq" />
          <ListRow icon={<ReceiptIcon size={20} />} label="Help with a booking" description="Open it from My bookings" href="/bookings" />
          <ListRow icon={<FlagIcon size={20} />} label="Report an issue" description="Something went wrong? Tell us" href="/help/report" />
        </SectionCard>

        <p className={cn("px-1 text-center text-xs leading-5 text-subtle")}>RideGo support is available every day, 24 hours.</p>
      </Screen>
    </>
  );
}
