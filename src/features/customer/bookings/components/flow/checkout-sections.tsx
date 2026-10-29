"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarBlankIcon, CheckCircleIcon, IdentificationCardIcon, PhoneIcon, UserIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { RentalDateSelector, rentalDays, type RentalSelection } from "@/components/customer/rental-date-selector";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Checkbox } from "@/components/ui/selection-controls";
import { TextInput } from "@/components/ui/text-field";
import { formatRange, isBooked, toISO, toRange } from "@/features/customer/bookings/lib/dates";
import { maskLicence } from "@/features/customer/bookings/hooks/use-booking";
import type { BookingAddon, BookingDraft } from "@/features/customer/bookings/types";
import type { Motorcycle } from "@/features/customer/vehicles/lib/view-model";
import { useTranslations } from "@/i18n/hooks";
import { formatMoney } from "@/lib/format";

type PatchProps = { draft: BookingDraft; patch: (partial: Partial<BookingDraft>) => void };

export function TripSection({ bike, draft, patch, addons, addonsPending }: PatchProps & { bike: Motorcycle; addons: BookingAddon[]; addonsPending: boolean }) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const value: RentalSelection = { range: toRange(draft.start ?? undefined, draft.end ?? undefined), pickupTime: draft.pickupTime, dropTime: draft.dropTime };
  // Dates usually arrive already chosen from the bike page; collapse the picker into a
  // summary so it isn't shown a second time, but let the customer reopen it to change them.
  const [editingDates, setEditingDates] = useState(!value.range);

  return (
    <div className="flex flex-col gap-5">
      {editingDates ? (
        <RentalDateSelector
          value={value}
          isDateUnavailable={(date) => isBooked(bike, date)}
          onChange={(next) => {
            patch({
              start: next.range ? toISO(next.range.start) : null,
              end: next.range ? toISO(next.range.end) : null,
              pickupTime: next.pickupTime,
              dropTime: next.dropTime,
            });
            if (next.range) setEditingDates(false);
          }}
        />
      ) : value.range ? (
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
            <CalendarBlankIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{formatRange(toISO(value.range.start), toISO(value.range.end))}</p>
            <p className="text-xs text-subtle">{common("days", { count: rentalDays(value.range) })} · {value.pickupTime} – {value.dropTime}</p>
          </div>
          <Button variant="ghost" size="sm" onPress={() => setEditingDates(true)}>
            {t("changeDates")}
          </Button>
        </div>
      ) : null}
      <fieldset className="flex flex-col">
        <legend className="mb-1 text-sm font-semibold">{t("addOns")}</legend>
        {addonsPending ? <p className="py-2 text-sm text-subtle" role="status">Loading add-ons…</p> : null}
        {addons.map((addon) => (
          <Checkbox key={addon.code} isSelected={Boolean(draft.addOns[addon.code])} onChange={(selected) => patch({ addOns: { ...draft.addOns, [addon.code]: selected } })}>
            {addon.name} · {formatMoney(addon.pricePerDayMinor / 100)} / day
          </Checkbox>
        ))}
        {!addonsPending && addons.length === 0 ? <p className="py-2 text-sm text-subtle">No add-ons are currently available.</p> : null}
      </fieldset>
    </div>
  );
}

type Say = (key: "errName" | "errPhone") => string;

const riderSchema = (say: Say) =>
  z.object({
    name: z.string().trim().min(2, say("errName")),
    phone: z.string().regex(/^\+?[\d\s-]{7,20}$/, say("errPhone")),
  });

const keyOnly: Say = (key) => key;

export type RiderValues = z.infer<ReturnType<typeof riderSchema>>;

/**
 * The rider is the signed-in customer. When their profile already has a name and phone this is a
 * one-line summary; it only becomes a form when something is missing or they choose to edit.
 * Submitting it (via the checkout footer) confirms the booking.
 */
export function RiderDetails({ formId, initial, onSubmit }: { formId: string; initial: RiderValues; onSubmit: (rider: RiderValues) => void }) {
  const t = useTranslations("booking");
  const [editing, setEditing] = useState(false);
  const complete = riderSchema(keyOnly).safeParse(initial).success;
  const showForm = editing || !complete;
  const { control, handleSubmit } = useForm({ resolver: zodResolver(riderSchema(t)), mode: "onBlur", values: initial });

  return (
    <form id={formId} noValidate className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit, () => setEditing(true))}>
      {showForm ? (
        <>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput label={t("fullName")} autoComplete="name" startIcon={<UserIcon size={20} />} value={field.value} onChange={field.onChange} onBlur={field.onBlur} isInvalid={fieldState.invalid} error={fieldState.error?.message} />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput label={t("mobile")} type="tel" inputMode="tel" autoComplete="tel" description={t("mobileHint")} startIcon={<PhoneIcon size={20} />} value={field.value} onChange={field.onChange} onBlur={field.onBlur} isInvalid={fieldState.invalid} error={fieldState.error?.message} />
            )}
          />
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
            <UserIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{initial.name}</p>
            <p className="tabular truncate text-xs text-subtle">{initial.phone}</p>
          </div>
          <Button variant="ghost" size="sm" onPress={() => setEditing(true)}>
            {t("editDetails")}
          </Button>
        </div>
      )}
    </form>
  );
}

/** Licence isn't required to book: show it if it's on file, otherwise say to bring it (or add it now). */
export function LicenceNote({ licence }: { licence: { number: string } | null }) {
  const t = useTranslations("booking");

  if (licence) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
          <CheckCircleIcon size={20} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{t("licenceOnFile")}</p>
          <p className="tabular truncate text-xs text-subtle">{maskLicence(licence.number)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-card border border-dashed border-line bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-secondary text-subtle">
        <IdentificationCardIcon size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <p className="text-sm text-subtle">{t("licenceMissing")}</p>
        <ButtonLink href="/profile" variant="outline" size="sm">{t("addLicence")}</ButtonLink>
      </div>
    </div>
  );
}
