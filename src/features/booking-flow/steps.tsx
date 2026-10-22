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

type PatchProps = { draft: BookingDraft; patch: (partial: Partial<BookingDraft>) => void };

// ---------------------------------------------------------------- 1. Dates

export function DatesStep({ bike, draft, patch }: PatchProps & { bike: Motorcycle }) {
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
        <legend className="mb-1 text-sm font-semibold">Add-ons</legend>
        <Checkbox isSelected={draft.addOns.helmet} onChange={(helmet) => patch({ addOns: { ...draft.addOns, helmet } })}>
          Helmet · ₹100 / day
        </Checkbox>
        <Checkbox isSelected={draft.addOns.jacket} onChange={(jacket) => patch({ addOns: { ...draft.addOns, jacket } })}>
          Riding jacket · ₹150 / day
        </Checkbox>
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------- 2. Rider

const riderSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number."),
  email: z.email("Enter a valid email address."),
});

export function RiderStep({ draft, patch, onValid, formId }: PatchProps & { onValid: () => void; formId: string }) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(riderSchema),
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
            label="Full name"
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
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            description="We send pickup updates here."
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
            label="Email"
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

// ---------------------------------------------------------------- 3. Licence

const licenceSchema = z.object({
  licenceNumber: z.string().regex(/^[A-Za-z]{2}\d{2}[\s-]?\d{4}[\s-]?\d{7}$/, "Use the format RJ14 2021 0012345."),
});

export function LicenceStep({ draft, patch, onValid, formId }: PatchProps & { onValid: () => void; formId: string }) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(licenceSchema),
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
              label="Driving licence number"
              autoComplete="off"
              startIcon={<IdentificationCardIcon size={20} />}
              description="As printed on your licence."
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
        <p className="text-sm font-semibold">Licence photo</p>
        <p className="text-xs text-subtle">Upload is coming soon. Carry the original to pickup.</p>
      </div>

      <Checkbox isSelected={draft.licenceLater} onChange={(licenceLater) => patch({ licenceLater })}>
        I will show my licence at pickup
      </Checkbox>
    </form>
  );
}

export function licenceStepValid(draft: BookingDraft) {
  return draft.licenceLater || licenceSchema.safeParse({ licenceNumber: draft.licenceNumber }).success;
}

export function riderStepValid(draft: BookingDraft) {
  return riderSchema.safeParse(draft.rider).success;
}

// ---------------------------------------------------------------- 4. Review

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
            {quote.days} {quote.days === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      <dl className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">Rider</dt>
          <dd className="text-right font-semibold">{draft.rider.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">Contact</dt>
          <dd className="text-right font-semibold">{draft.rider.phone}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-subtle">Licence</dt>
          <dd className="text-right font-semibold">
            {draft.licenceLater ? <StatusBadge tone="brand">Show at pickup</StatusBadge> : draft.licenceNumber}
          </dd>
        </div>
      </dl>

      <BookingSummary lines={quoteLines(quote)} totalLabel="Total payable" />

      <Checkbox isSelected={agreed} onChange={onAgree}>
        I accept the rental terms and cancellation policy
      </Checkbox>
    </div>
  );
}

// ---------------------------------------------------------------- 5. Payment

export const paymentMethods = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit / debit card" },
  { value: "netbanking", label: "Net banking" },
  { value: "pickup", label: "Pay at pickup" },
];

export function PaymentStep({ draft, patch }: PatchProps) {
  return (
    <div className="flex flex-col gap-4">
      <RadioGroup label="Payment method" value={draft.payment} onChange={(payment) => patch({ payment })} options={paymentMethods} />
      <p className="rounded-control bg-surface-secondary px-4 py-3 text-sm text-subtle">
        Payments are simulated in this preview. No money moves and no card details are collected.
      </p>
    </div>
  );
}
