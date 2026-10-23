"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimpleIcon, IdentificationCardIcon, PhoneIcon, UploadSimpleIcon, UserIcon } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { BookingSummary } from "@/components/customer/booking-summary";
import { RentalDateSelector, type RentalSelection } from "@/components/customer/rental-date-selector";
import { BikeImage } from "@/components/shared/bike-image";
import { Checkbox, RadioGroup } from "@/components/ui/selection-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-field";
import { formatDay, isBooked, toISO, toRange } from "@/features/bookings/dates";
import type { Quote } from "@/features/bookings/pricing";
import { quoteLines } from "@/features/bookings/pricing";
import type { BookingDraft } from "@/features/bookings/types";
import type { Motorcycle } from "@/features/mock/data";
import { useTranslations } from "@/i18n/hooks";

type PatchProps = { draft: BookingDraft; patch: (partial: Partial<BookingDraft>) => void };

export function DatesStep({ bike, draft, patch }: PatchProps & { bike: Motorcycle }) {
  const t = useTranslations("booking");
  const value: RentalSelection = { range: toRange(draft.start ?? undefined, draft.end ?? undefined), pickupTime: draft.pickupTime, dropTime: draft.dropTime };

  return (
    <div className="flex flex-col gap-5">
      <RentalDateSelector
        value={value}
        isDateUnavailable={(date) => isBooked(bike, date)}
        onChange={(next) =>
          patch({
            start: next.range ? toISO(next.range.start) : null,
            end: next.range ? toISO(next.range.end) : null,
            pickupTime: next.pickupTime,
            dropTime: next.dropTime,
          })
        }
      />
      <fieldset className="flex flex-col">
        <legend className="mb-1 text-sm font-semibold">{t("addOns")}</legend>
        <Checkbox isSelected={draft.addOns.helmet} onChange={(helmet) => patch({ addOns: { ...draft.addOns, helmet } })}>
          {t("addonHelmet")}
        </Checkbox>
        <Checkbox isSelected={draft.addOns.jacket} onChange={(jacket) => patch({ addOns: { ...draft.addOns, jacket } })}>
          {t("addonJacket")}
        </Checkbox>
      </fieldset>
    </div>
  );
}

type Say = (key: "errName" | "errPhone" | "errEmail" | "errLicence") => string;

const riderSchema = (say: Say) =>
  z.object({
    name: z.string().trim().min(2, say("errName")),
    phone: z.string().regex(/^[6-9]\d{9}$/, say("errPhone")),
    email: z.email(say("errEmail")),
  });

const keyOnly: Say = (key) => key;

export function RiderStep({ draft, patch, onValid, formId }: PatchProps & { onValid: () => void; formId: string }) {
  const t = useTranslations("booking");
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(riderSchema(t)),
    mode: "onBlur",
    values: draft.rider,
  });

  return (
    <form
      id={formId}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((rider) => {
        patch({ rider });
        onValid();
      })}
    >
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <TextInput
            label={t("fullName")}
            autoComplete="name"
            startIcon={<UserIcon size={20} />}
            value={field.value}
            onChange={(name) => {
              field.onChange(name);
              patch({ rider: { ...draft.rider, name } });
            }}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <TextInput
            label={t("mobile")}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            description={t("mobileHint")}
            startIcon={<PhoneIcon size={20} />}
            value={field.value}
            onChange={(phone) => {
              field.onChange(phone);
              patch({ rider: { ...draft.rider, phone } });
            }}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <TextInput
            label={t("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            startIcon={<EnvelopeSimpleIcon size={20} />}
            value={field.value}
            onChange={(email) => {
              field.onChange(email);
              patch({ rider: { ...draft.rider, email } });
            }}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            error={fieldState.error?.message}
          />
        )}
      />
    </form>
  );
}

const licenceSchema = (say: Say) =>
  z.object({
    licenceNumber: z.string().regex(/^[A-Za-z]{2}\d{2}[\s-]?\d{4}[\s-]?\d{7}$/, say("errLicence")),
  });

export function LicenceStep({ draft, patch, onValid, formId }: PatchProps & { onValid: () => void; formId: string }) {
  const t = useTranslations("booking");
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(licenceSchema(t)),
    mode: "onBlur",
    values: { licenceNumber: draft.licenceNumber },
  });

  return (
    <form
      id={formId}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(({ licenceNumber }) => {
        patch({ licenceNumber, licenceLater: false });
        onValid();
      })}
    >
      {draft.licenceLater ? null : (
        <Controller
          name="licenceNumber"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label={t("licenceNumber")}
              autoComplete="off"
              startIcon={<IdentificationCardIcon size={20} />}
              description={t("licenceHint")}
              value={field.value}
              onChange={(licenceNumber) => {
                field.onChange(licenceNumber);
                patch({ licenceNumber });
              }}
              onBlur={field.onBlur}
              isInvalid={fieldState.invalid}
              error={fieldState.error?.message}
            />
          )}
        />
      )}

      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface px-4 py-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-secondary text-subtle">
          <UploadSimpleIcon size={20} />
        </span>
        <p className="text-sm font-semibold">{t("licencePhoto")}</p>
        <p className="text-xs text-subtle">{t("uploadSoon")}</p>
      </div>

      <Checkbox isSelected={draft.licenceLater} onChange={(licenceLater) => patch({ licenceLater })}>
        {t("licenceLater")}
      </Checkbox>
    </form>
  );
}

export function licenceStepValid(draft: BookingDraft) {
  return draft.licenceLater || licenceSchema(keyOnly).safeParse({ licenceNumber: draft.licenceNumber }).success;
}

export function riderStepValid(draft: BookingDraft) {
  return riderSchema(keyOnly).safeParse(draft.rider).success;
}

export function ReviewStep({
  bike,
  draft,
  quote,
  agreed,
  onAgree,
}: {
  bike: Motorcycle;
  draft: BookingDraft;
  quote: Quote;
  agreed: boolean;
  onAgree: (agreed: boolean) => void;
}) {
  const t = useTranslations("booking");
  const common = useTranslations("common");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-control bg-canvas">
          <BikeImage bike={bike} decorative sizes="80px" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <p className="truncate text-sm font-bold">{bike.name}</p>
          {draft.start && draft.end ? (
            <p className="text-xs text-subtle">
              {formatDay(draft.start, false)} {draft.pickupTime} → {formatDay(draft.end, false)} {draft.dropTime}
            </p>
          ) : null}
          <p className="text-xs text-subtle">
            {common("days", { count: quote.days })}
          </p>
        </div>
      </div>

      <dl className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">{t("reviewRider")}</dt>
          <dd className="text-right font-semibold">{draft.rider.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">{t("reviewContact")}</dt>
          <dd className="text-right font-semibold">{draft.rider.phone}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-subtle">{t("reviewLicence")}</dt>
          <dd className="text-right font-semibold">
            {draft.licenceLater ? <StatusBadge tone="brand">{t("showAtPickup")}</StatusBadge> : draft.licenceNumber}
          </dd>
        </div>
      </dl>

      <BookingSummary lines={quoteLines(quote)} totalLabel="totalPayable" />

      <Checkbox isSelected={agreed} onChange={onAgree}>
        {t("acceptTerms")}
      </Checkbox>
    </div>
  );
}

export const paymentMethods = [
  { value: "aba-khqr", label: "ABA KHQR" },
];

export function PaymentStep({ patch }: Pick<PatchProps, "patch">) {
  const t = useTranslations("booking");

  return (
    <div className="flex flex-col gap-4">
      <RadioGroup label={t("paymentMethod")} value="aba-khqr" onChange={(payment) => patch({ payment })} options={paymentMethods} />
      <p className="rounded-control bg-surface-secondary px-4 py-3 text-sm text-subtle">
        {t("payNote")}
      </p>
    </div>
  );
}
