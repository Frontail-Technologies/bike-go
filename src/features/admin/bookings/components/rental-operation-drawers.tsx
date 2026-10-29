"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDialog, Description, Drawer, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { AdminButton as Button } from "@/components/admin/controls";
import { Checkbox } from "@/components/ui/selection-controls";
import { actionErrorMessage } from "../hooks/use-booking-actions";
import { conditionLabels, distanceTravelled, durationLabel, fmtDateTime, fuelLabels, ictLocalToIso, isoToIctLocal } from "../lib/booking-model";
import { handoverSchema, returnSchema, type HandoverValues, type ReturnValues } from "../schemas/booking-schemas";
import { fuelLevels, vehicleConditions, type Booking, type HandoverInput, type ReturnInput } from "../types/booking";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const fuelOptions = () => fuelLevels.map((value) => ({ value, label: fuelLabels[value] }));
const conditionOptions = () => vehicleConditions.map((value) => ({ value, label: conditionLabels[value] }));

function BookingSummary({ booking }: { booking: Booking }) {
  const t = useAdminTranslations();
  return <dl className="adminTile grid gap-3 rounded-xl p-3 text-sm sm:grid-cols-2">
    <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("bookings.operations.booking")}</dt><dd className="font-bold">{booking.reference}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("bookings.operations.customer")}</dt><dd className="font-bold">{booking.customer.name}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("bookings.operations.vehicle")}</dt><dd className="font-bold">{booking.vehicle.name}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("bookings.operations.scheduledPickup")}</dt><dd className="font-bold">{fmtDateTime(booking.pickupAt)} ICT</dd></div>
  </dl>;
}

function ChoiceSelect<V extends HandoverValues | ReturnValues>({ control, name, label, options }: { control: Control<V>; name: FieldPath<V>; label: string; options: Array<{ value: string; label: string }> }) {
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <Select value={String(field.value)} onChange={(key) => key !== null && field.onChange(String(key))}>
        <Label>{label}</Label>
        <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
        <Select.Popover className="adminOverlay"><ListBox>{options.map((option) => <ListBox.Item key={option.value} id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
      </Select>
    )} />
  );
}

function TextInput<V extends HandoverValues | ReturnValues>({ control, name, label, type = "text", description, required = true, ...rest }: { control: Control<V>; name: FieldPath<V>; label: string; type?: string; description?: string; required?: boolean; min?: number; placeholder?: string }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextField isRequired={required} value={String(field.value)} onChange={field.onChange} isInvalid={Boolean(fieldState.error)}>
        <Label>{label}</Label><Input type={type} inputMode={type === "number" ? "numeric" : undefined} {...rest} />
        {description ? <Description>{description}</Description> : null}<FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )} />
  );
}

function NotesField<V extends HandoverValues | ReturnValues>({ control, name, label, placeholder, required = false }: { control: Control<V>; name: FieldPath<V>; label: string; placeholder: string; required?: boolean }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextField value={String(field.value)} onChange={field.onChange} isInvalid={Boolean(fieldState.error)} isRequired={required}>
        <Label>{label}</Label><TextArea rows={3} placeholder={placeholder} /><FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )} />
  );
}

function FormError({ message }: { message: string }) {
  const t = useAdminTranslations();
  return message ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{t("bookings.dialogs.notSaved")}</Alert.Title><Alert.Description>{message}</Alert.Description></Alert.Content></Alert> : null;
}

function HandoverFormBody({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (input: HandoverInput) => Promise<unknown> }) {
  const t = useAdminTranslations();
  const depositRequired = booking.pricing.securityDepositMinor > 0;
  const [error, setError] = useState("");
  const form = useForm<HandoverValues>({
    resolver: zodResolver(handoverSchema),
    defaultValues: { actualPickupAt: isoToIctLocal(new Date().toISOString()), odometerKm: "", fuelLevel: "full", condition: "good", existingDamageNotes: "", licenceVerified: false, identityVerified: false, depositVerified: !depositRequired, staffNotes: "", depositRequired },
  });
  const verification = form.formState.errors.root?.message ?? (form.formState.errors as Record<string, { message?: string }>).verification?.message;

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      await onConfirm({
        actualPickupAt: ictLocalToIso(values.actualPickupAt), odometerKm: Number(values.odometerKm), fuelLevel: values.fuelLevel, condition: values.condition,
        existingDamageNotes: values.existingDamageNotes.trim() || undefined, licenceVerified: values.licenceVerified, identityVerified: values.identityVerified, depositVerified: values.depositVerified,
        staffNotes: values.staffNotes.trim() || undefined,
      });
      onClose();
    } catch (failure) {
      setError(actionErrorMessage(failure));
    }
  });

  return <Form onSubmit={submit} className="contents">
    <Drawer.Body className="space-y-5 pb-8">
      <FormError message={error} />
      <BookingSummary booking={booking} />
      <p className="text-xs text-[var(--admin-muted)]">{t("bookings.operations.ictNoteBefore")}<strong>{t("bookings.operations.ictZone")}</strong>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput control={form.control} name="actualPickupAt" label={t("bookings.operations.actualPickup")} type="datetime-local" />
        <TextInput control={form.control} name="odometerKm" label={t("bookings.operations.odometer")} type="number" min={0} placeholder={t("bookings.operations.odometerPlaceholder")} />
        <ChoiceSelect control={form.control} name="fuelLevel" label={t("bookings.operations.fuelLevel")} options={fuelOptions()} />
        <ChoiceSelect control={form.control} name="condition" label={t("bookings.operations.condition")} options={conditionOptions()} />
      </div>
      <NotesField control={form.control} name="existingDamageNotes" label={t("bookings.operations.existingDamage")} placeholder={t("bookings.operations.existingDamagePlaceholder")} />
      <fieldset className="space-y-1"><legend className="mb-1 text-sm font-bold">{t("bookings.operations.verification")}</legend>
        <Controller control={form.control} name="licenceVerified" render={({ field }) => <Checkbox isSelected={field.value} onChange={(value) => { field.onChange(value); form.clearErrors(); }}>{t("bookings.operations.licence")}</Checkbox>} />
        <Controller control={form.control} name="identityVerified" render={({ field }) => <Checkbox isSelected={field.value} onChange={(value) => { field.onChange(value); form.clearErrors(); }}>{t("bookings.operations.identity")}</Checkbox>} />
        {depositRequired ? <Controller control={form.control} name="depositVerified" render={({ field }) => <Checkbox isSelected={field.value} onChange={(value) => { field.onChange(value); form.clearErrors(); }}>{t("bookings.operations.deposit")}</Checkbox>} /> : null}
        {verification ? <p role="alert" className="text-xs font-semibold text-[var(--admin-danger)]">{verification}</p> : null}
      </fieldset>
      <NotesField control={form.control} name="staffNotes" label={t("bookings.operations.staffNotes")} placeholder={t("bookings.operations.handoverPlaceholder")} />
    </Drawer.Body>
    <Drawer.Footer className="grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white"><Button type="button" variant="tertiary" className="min-h-12" onPress={onClose}>{t("common.cancel")}</Button><Button type="submit" className="min-h-12" isPending={form.formState.isSubmitting}>{t("bookings.operations.confirmHandover")}</Button></Drawer.Footer>
  </Form>;
}

type DrawerProps<T> = { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (input: T) => Promise<unknown> };

export function HandoverDrawer({ booking, isOpen, onOpenChange, onConfirm }: DrawerProps<HandoverInput>) {
  const t = useAdminTranslations();
  return <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><Drawer.Content placement="right" className="h-dvh w-full max-w-xl"><Drawer.Dialog aria-label={t("bookings.operations.handoverAria")}><Drawer.CloseTrigger /><Drawer.Header><Drawer.Heading>{t("bookings.operations.handoverTitle")}</Drawer.Heading></Drawer.Header>
    <HandoverFormBody key={booking.reference} booking={booking} onClose={() => onOpenChange(false)} onConfirm={onConfirm} />
  </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>;
}

function ReturnFormBody({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (input: ReturnInput) => Promise<unknown> }) {
  const t = useAdminTranslations();
  const pickupOdometer = booking.pickupInspection?.odometerKm ?? 0;
  const [error, setError] = useState("");
  const form = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { actualReturnAt: isoToIctLocal(new Date().toISOString()), odometerKm: String(pickupOdometer), fuelLevel: "three_quarters", condition: "good", newDamageFound: false, damageNotes: "", staffNotes: "" },
  });
  const values = form.watch();
  const odometer = Number(values.odometerKm);
  const distance = values.odometerKm !== "" && Number.isFinite(odometer) ? distanceTravelled({ pickupInspection: booking.pickupInspection, returnInspection: { odometerKm: odometer } as NonNullable<Booking["returnInspection"]> }) : null;
  const returnedAt = values.actualReturnAt ? Date.parse(ictLocalToIso(values.actualReturnAt)) : Number.NaN;
  const late = Number.isFinite(returnedAt) ? Math.max(0, Math.round((returnedAt - Date.parse(booking.returnAt)) / 60_000)) : 0;

  const submit = form.handleSubmit(async (formValues) => {
    setError("");
    const actualReturnAt = ictLocalToIso(formValues.actualReturnAt);
    if (booking.pickupInspection && Date.parse(actualReturnAt) < Date.parse(booking.pickupInspection.occurredAt)) { form.setError("actualReturnAt", { message: t("bookings.operations.returnAfterHandover") }); return; }
    if (Number(formValues.odometerKm) < pickupOdometer) { form.setError("odometerKm", { message: t("bookings.operations.minMileage", { value: pickupOdometer.toLocaleString() }) }); return; }
    try {
      await onConfirm({
        actualReturnAt, odometerKm: Number(formValues.odometerKm), fuelLevel: formValues.fuelLevel, condition: formValues.condition, newDamageFound: formValues.newDamageFound,
        damageNotes: formValues.damageNotes.trim() || undefined, staffNotes: formValues.staffNotes.trim() || undefined,
      });
      onClose();
    } catch (failure) {
      setError(actionErrorMessage(failure));
    }
  });

  return <Form onSubmit={submit} className="contents">
    <Drawer.Body className="space-y-5 pb-8">
      <FormError message={error} />
      <BookingSummary booking={booking} />
      <div className="grid gap-2 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-xs sm:grid-cols-3">
        <div><p className="text-[var(--admin-muted)]">{t("bookings.operations.scheduledReturn")}</p><p className="font-bold">{fmtDateTime(booking.returnAt)} ICT</p></div>
        <div><p className="text-[var(--admin-muted)]">{t("bookings.operations.distance")}</p><p className="font-bold">{distance === null ? "—" : t("bookings.detail.km", { value: distance.toLocaleString() })}</p></div>
        <div><p className="text-[var(--admin-muted)]">{t("bookings.operations.lateReturn")}</p><p className={`font-bold ${late ? "text-[var(--admin-danger)]" : ""}`}>{late ? durationLabel(late) : t("bookings.operations.onTime")}</p></div>
      </div>
      <p className="text-xs text-[var(--admin-muted)]">{t("bookings.operations.ictNoteBefore")}<strong>{t("bookings.operations.ictZone")}</strong>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput control={form.control} name="actualReturnAt" label={t("bookings.operations.actualReturn")} type="datetime-local" />
        <TextInput control={form.control} name="odometerKm" label={t("bookings.operations.returnOdometer")} type="number" min={pickupOdometer} description={t("bookings.operations.pickupOdometer", { value: pickupOdometer.toLocaleString() })} />
        <ChoiceSelect control={form.control} name="fuelLevel" label={t("bookings.operations.fuelLevel")} options={fuelOptions()} />
        <ChoiceSelect control={form.control} name="condition" label={t("bookings.operations.condition")} options={conditionOptions()} />
      </div>
      <fieldset><legend className="mb-2 text-sm font-bold">{t("bookings.operations.newDamage")}</legend><div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={!values.newDamageFound ? "primary" : "outline"} className="min-h-11" onPress={() => form.setValue("newDamageFound", false, { shouldValidate: true })}>{t("common.no")}</Button>
        <Button type="button" variant={values.newDamageFound ? "danger" : "outline"} className="min-h-11" onPress={() => form.setValue("newDamageFound", true, { shouldValidate: true })}>{t("common.yes")}</Button>
      </div></fieldset>
      <NotesField control={form.control} name="damageNotes" label={t("bookings.operations.damageNotes")} required={values.newDamageFound} placeholder={values.newDamageFound ? t("bookings.operations.damagePlaceholder") : t("bookings.operations.conditionPlaceholder")} />
      <NotesField control={form.control} name="staffNotes" label={t("bookings.operations.staffNotes")} placeholder={t("bookings.operations.returnPlaceholder")} />
    </Drawer.Body>
    <Drawer.Footer className="grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white"><Button type="button" variant="tertiary" className="min-h-12" onPress={onClose}>{t("common.cancel")}</Button><Button type="submit" className="min-h-12" isPending={form.formState.isSubmitting}>{t("bookings.operations.confirmReturn")}</Button></Drawer.Footer>
  </Form>;
}

export function ReturnInspectionDrawer({ booking, isOpen, onOpenChange, onConfirm }: DrawerProps<ReturnInput>) {
  const t = useAdminTranslations();
  return <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><Drawer.Content placement="right" className="h-dvh w-full max-w-xl"><Drawer.Dialog aria-label={t("bookings.operations.returnAria")}><Drawer.CloseTrigger /><Drawer.Header><Drawer.Heading>{t("bookings.operations.returnTitle")}</Drawer.Heading></Drawer.Header>
    <ReturnFormBody key={booking.reference} booking={booking} onClose={() => onOpenChange(false)} onConfirm={onConfirm} />
  </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>;
}

export function CompleteBookingDialog({ booking, isOpen, onOpenChange, onConfirm }: { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<unknown> }) {
  const t = useAdminTranslations();
  const distance = distanceTravelled(booking);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    setPending(true);
    setError("");
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (failure) {
      setError(actionErrorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return <AlertDialog><AlertDialog.Trigger className="hidden" aria-hidden>{t("bookings.operations.openComplete")}</AlertDialog.Trigger><AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><AlertDialog.Container><AlertDialog.Dialog>
    <AlertDialog.Header><AlertDialog.Icon status="accent" /><AlertDialog.Heading>{t("bookings.operations.completeTitle", { reference: booking.reference })}</AlertDialog.Heading></AlertDialog.Header>
    <AlertDialog.Body className="space-y-4"><p className="text-sm text-[var(--admin-muted)]">{t("bookings.operations.completeIntro")}</p>
      <dl className="adminTile grid gap-3 rounded-xl p-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[var(--admin-muted)]">{t("bookings.operations.customer")}</dt><dd className="font-bold">{booking.customer.name}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">{t("bookings.operations.vehicle")}</dt><dd className="font-bold">{booking.vehicle.name}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">{t("bookings.operations.distanceShort")}</dt><dd className="font-bold">{distance === null ? "—" : t("bookings.detail.km", { value: distance.toLocaleString() })}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">{t("bookings.operations.damage")}</dt><dd className="font-bold">{booking.returnInspection?.damageFound ? t("bookings.operations.damageReported") : t("bookings.operations.noneReported")}</dd></div></dl>
      <FormError message={error} />
    </AlertDialog.Body><AlertDialog.Footer><Button variant="tertiary" className="min-h-11" onPress={() => onOpenChange(false)}>{t("bookings.operations.keepReturned")}</Button><Button className="min-h-11" isPending={pending} onPress={() => void confirm()}>{t("bookings.action.completed")}</Button></AlertDialog.Footer>
  </AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog>;
}

