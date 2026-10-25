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
import { toast } from "@/components/ui/toast";
import { formatRange } from "@/features/bookings/dates";
import { useBookingsQuery } from "@/features/bookings/hooks/generated";
import { supportTicketsApi, type SupportTicketCategory } from "@/features/help/api/support-tickets-api";
import { useTranslations } from "@/i18n/hooks";
import { ApiError } from "@/lib/api/error";

const categories = [
  { id: "booking", key: "reportCatBooking" },
  { id: "payment", key: "reportCatPayment" },
  { id: "bike", key: "reportCatBike" },
  { id: "pickup", key: "reportCatPickup" },
  { id: "app", key: "reportCatApp" },
  { id: "other", key: "reportCatOther" },
] as const;

const schema = (message: string) =>
  z.object({
    category: z.string().min(1),
    booking: z.string().min(1),
    message: z.string().trim().min(20, message),
  });

export function ReportIssueView() {
  const bookingQuery = useBookingsQuery({ page: 1, pageSize: 100 });
  const bookings = (bookingQuery.data?.data ?? []).map((booking) => ({
    reference: booking.reference,
    bikeId: booking.vehicle.slug,
    startDate: booking.pickupAt,
    endDate: booking.returnAt,
    vehicleName: booking.vehicle.name,
  }));
  const getBike = (id: string) => bookings.find((booking) => booking.bikeId === id) ? { name: bookings.find((booking) => booking.bikeId === id)!.vehicleName } : undefined;
  const t = useTranslations("help");
  const [ticket, setTicket] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema(t("reportErrMessage"))),
    mode: "onBlur",
    defaultValues: { category: "booking", booking: "none", message: "" },
  });

  const bookingOptions = [
    { id: "none", label: t("reportNone") },
    ...bookings.map((b) => ({ id: b.reference, label: `${b.reference} · ${getBike(b.bikeId)?.name ?? t("reportFallbackBike")} · ${formatRange(b.startDate, b.endDate)}` })),
  ];

  const send = handleSubmit(async (values) => {
    try {
      const created = await supportTicketsApi.create({
        category: values.category as SupportTicketCategory,
        bookingReference: values.booking === "none" ? null : values.booking,
        message: values.message,
      });
      setTicket(created.reference);
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The issue could not be sent. Try again.");
    }
  });

  if (ticket) {
    return (
      <>
        <AppBar leading="back" backFallback="/help" title={t("reportTitle")} />
        <Screen enter="slide" className="flex flex-col items-center gap-4 pt-10 text-center md:max-w-xl">
          <span className="flex size-16 items-center justify-center rounded-full bg-brand text-ink">
            <CheckIcon size={32} weight="bold" />
          </span>
          <h2 className="text-2xl leading-8 font-extrabold tracking-tight">{t("reportSent")}</h2>
          <p className="text-[15px] leading-7 text-ink/80">
            {t.rich("reportThanks", { ticket, ref: (chunks) => <span data-testid="ticket-ref" className="tabular font-bold text-ink">{chunks}</span> })}
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-3">
            <ButtonLink href="/help" variant="outline" size="lg">
              {t("backToHelp")}
            </ButtonLink>
            <ButtonLink href="/bookings" size="lg">
              {t("myBookings")}
            </ButtonLink>
          </div>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppBar leading="back" backFallback="/help" title={t("reportTitle")} />
      <Screen enter="slide" bottom="footer" className="md:max-w-2xl md:pb-12">
        <DesktopTitle title={t("reportTitle")} subtitle={t("reportSubtitle")} className="mb-6" />
        <form id="report-form" noValidate className="flex flex-col gap-5" onSubmit={send}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <AppSelect label={t("reportAbout")} options={categories.map((c) => ({ id: c.id, label: t(c.key) }))} value={field.value} onChange={(key) => key && field.onChange(String(key))} />
            )}
          />
          <Controller
            name="booking"
            control={control}
            render={({ field }) => (
              <AppSelect label={t("reportWhich")} options={bookingOptions} value={field.value} onChange={(key) => key && field.onChange(String(key))} />
            )}
          />
          <Controller
            name="message"
            control={control}
            render={({ field, fieldState }) => (
              <TextAreaInput
                label={t("reportWhat")}
                placeholder={t("reportPlaceholder")}
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
              {t("reportSend")}
            </Button>
          </div>
        </form>
      </Screen>
      <ScreenFooter hideFrom="md">
        <Button size="lg" fullWidth isPending={formState.isSubmitting} onPress={() => (document.getElementById("report-form") as HTMLFormElement | null)?.requestSubmit()}>
          {t("reportSend")}
        </Button>
      </ScreenFooter>
    </>
  );
}
