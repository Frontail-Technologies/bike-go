"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen, ScreenFooter } from "@/components/shared/screen";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { AppSelect } from "@/components/ui/select";
import { TextAreaInput } from "@/components/ui/text-field";
import { formatRange } from "@/features/bookings/dates";
import { bookingsStore } from "@/features/bookings/store";
import { getBike } from "@/features/mock/data";

const categories = [
  { id: "booking", label: "A booking" },
  { id: "payment", label: "Payment or refund" },
  { id: "bike", label: "Bike condition" },
  { id: "pickup", label: "Pickup or return" },
  { id: "app", label: "A problem with the app" },
  { id: "other", label: "Something else" },
];

const schema = z.object({
  category: z.string().min(1),
  booking: z.string().min(1),
  message: z.string().trim().min(20, "Please add a little more detail (at least 20 characters)."),
});

const SIMULATED_SEND_MS = 700;

export function ReportIssueView() {
  const bookings = bookingsStore.useValue();
  const [ticket, setTicket] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { category: "booking", booking: "none", message: "" },
  });

  const bookingOptions = [
    { id: "none", label: "Not about a booking" },
    ...bookings.map((b) => ({ id: b.reference, label: `${b.reference} · ${getBike(b.bikeId)?.name ?? "Bike"} · ${formatRange(b.startDate, b.endDate)}` })),
  ];

  const send = handleSubmit(
    () =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          setTicket(`SUP-${Math.floor(10000 + Math.random() * 89999)}`);
          resolve();
        }, SIMULATED_SEND_MS);
      }),
  );

  if (ticket) {
    return (
      <>
        <AppBar leading="back" backFallback="/help" title="Report an issue" />
        <Screen enter="slide" className="flex flex-col items-center gap-4 pt-10 text-center md:max-w-xl">
          <span className="flex size-16 items-center justify-center rounded-full bg-brand text-ink">
            <CheckIcon size={32} weight="bold" />
          </span>
          <h2 className="text-2xl leading-8 font-extrabold tracking-tight">Report sent</h2>
          <p className="text-[15px] leading-7 text-ink/80">
            Thanks. Your reference is <span data-testid="ticket-ref" className="tabular font-bold text-ink">{ticket}</span>. We will reply within 24 hours, usually much sooner.
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-3">
            <ButtonLink href="/help" variant="outline" size="lg">
              Back to help
            </ButtonLink>
            <ButtonLink href="/bookings" size="lg">
              My bookings
            </ButtonLink>
          </div>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar leading="back" backFallback="/help" title="Report an issue" />
      <Screen enter="slide" bottom="footer" className="md:max-w-2xl md:pb-12">
        <DesktopTitle title="Report an issue" subtitle="Tell us what went wrong and we will make it right." className="mb-6" />
        <form id="report-form" noValidate className="flex flex-col gap-5" onSubmit={send}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <AppSelect label="What is it about?" options={categories} value={field.value} onChange={(key) => key && field.onChange(String(key))} />
            )}
          />
          <Controller
            name="booking"
            control={control}
            render={({ field }) => (
              <AppSelect label="Which booking?" options={bookingOptions} value={field.value} onChange={(key) => key && field.onChange(String(key))} />
            )}
          />
          <Controller
            name="message"
            control={control}
            render={({ field, fieldState }) => (
              <TextAreaInput
                label="What happened?"
                placeholder="Describe the problem, and when it happened."
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            )}
          />
          <div className="hidden md:block">
            <Button type="submit" size="lg" isPending={formState.isSubmitting}>
              Send report
            </Button>
          </div>
        </form>
      </Screen>
      <ScreenFooter hideFrom="md">
        <Button size="lg" fullWidth isPending={formState.isSubmitting} onPress={() => (document.getElementById("report-form") as HTMLFormElement | null)?.requestSubmit()}>
          Send report
        </Button>
      </ScreenFooter>
    </>
  );
}
