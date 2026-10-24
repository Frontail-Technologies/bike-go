"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDialog, Button, Description, Drawer, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { Checkbox } from "@/components/ui/selection-controls";
import { actionErrorMessage } from "../hooks/use-booking-actions";
import { conditionLabels, distanceTravelled, durationLabel, fmtDateTime, fuelLabels, ictLocalToIso, isoToIctLocal } from "../lib/booking-model";
import { handoverSchema, returnSchema, type HandoverValues, type ReturnValues } from "../schemas/booking-schemas";
import { fuelLevels, vehicleConditions, type Booking, type HandoverInput, type ReturnInput } from "../types/booking";

const fuelOptions = fuelLevels.map((value) => ({ value, label: fuelLabels[value] }));
const conditionOptions = vehicleConditions.map((value) => ({ value, label: conditionLabels[value] }));

function BookingSummary({ booking }: { booking: Booking }) {
  return <dl className="adminTile grid gap-3 rounded-xl p-3 text-sm sm:grid-cols-2">
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Booking</dt><dd className="font-bold">{booking.reference}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Customer</dt><dd className="font-bold">{booking.customer.name}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Vehicle</dt><dd className="font-bold">{booking.vehicle.name}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Scheduled pickup</dt><dd className="font-bold">{fmtDateTime(booking.pickupAt)} ICT</dd></div>
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
  return message ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Not saved</Alert.Title><Alert.Description>{message}</Alert.Description></Alert.Content></Alert> : null;
}

function HandoverFormBody({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (input: HandoverInput) => Promise<unknown> }) {
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
      <p className="text-xs text-[var(--admin-muted)]">Date and time values are Cambodia local time: <strong>ICT — Asia/Phnom_Penh (UTC+7)</strong>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput control={form.control} name="actualPickupAt" label="Actual pickup — ICT" type="datetime-local" />
        <TextInput control={form.control} name="odometerKm" label="Current odometer (km)" type="number" min={0} placeholder="e.g. 12480" />
        <ChoiceSelect control={form.control} name="fuelLevel" label="Fuel level" options={fuelOptions} />
        <ChoiceSelect control={form.control} name="condition" label="Vehicle condition" options={conditionOptions} />
      </div>
      <NotesField control={form.control} name="existingDamageNotes" label="Existing damage notes" placeholder="Record scratches, dents, or write ‘None’." />
      <fieldset className="space-y-1"><legend className="mb-1 text-sm font-bold">Required verification</legend>
        <Controller control={form.control} name="licenceVerified" render={({ field }) => <Checkbox isSelected={field.value} onChange={(value) => { field.onChange(value); form.clearErrors(); }}>Driving licence verified</Checkbox>} />
        <Controller control={form.control} name="identityVerified" render={({ field }) => <Checkbox isSelected={field.value} onChange={(value) => { field.onChange(value); form.clearErrors(); }}>Customer identity verified</Checkbox>} />
        {depositRequired ? <Controller control={form.control} name="depositVerified" render={({ field }) => <Checkbox isSelected={field.value} onChange={(value) => { field.onChange(value); form.clearErrors(); }}>Security deposit received / verified</Checkbox>} /> : null}
        {verification ? <p role="alert" className="text-xs font-semibold text-[var(--admin-danger)]">{verification}</p> : null}
      </fieldset>
      <NotesField control={form.control} name="staffNotes" label="Staff notes" placeholder="Optional internal handover notes" />
    </Drawer.Body>
    <Drawer.Footer className="grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white"><Button type="button" variant="tertiary" className="min-h-12" onPress={onClose}>Cancel</Button><Button type="submit" className="min-h-12" isPending={form.formState.isSubmitting}>Confirm Handover</Button></Drawer.Footer>
  </Form>;
}

type DrawerProps<T> = { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (input: T) => Promise<unknown> };

export function HandoverDrawer({ booking, isOpen, onOpenChange, onConfirm }: DrawerProps<HandoverInput>) {
  return <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><Drawer.Content placement="right" className="h-dvh w-full max-w-xl"><Drawer.Dialog aria-label="Start rental vehicle handover"><Drawer.CloseTrigger /><Drawer.Header><Drawer.Heading>Start Rental · Vehicle Handover</Drawer.Heading></Drawer.Header>
    <HandoverFormBody key={booking.reference} booking={booking} onClose={() => onOpenChange(false)} onConfirm={onConfirm} />
  </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>;
}

function ReturnFormBody({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (input: ReturnInput) => Promise<unknown> }) {
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
    if (booking.pickupInspection && Date.parse(actualReturnAt) < Date.parse(booking.pickupInspection.occurredAt)) { form.setError("actualReturnAt", { message: "Actual return must be after the vehicle handover." }); return; }
    if (Number(formValues.odometerKm) < pickupOdometer) { form.setError("odometerKm", { message: `Return mileage must be at least ${pickupOdometer.toLocaleString()} km.` }); return; }
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
        <div><p className="text-[var(--admin-muted)]">Scheduled return</p><p className="font-bold">{fmtDateTime(booking.returnAt)} ICT</p></div>
        <div><p className="text-[var(--admin-muted)]">Distance travelled</p><p className="font-bold">{distance === null ? "—" : `${distance.toLocaleString()} km`}</p></div>
        <div><p className="text-[var(--admin-muted)]">Late return</p><p className={`font-bold ${late ? "text-[var(--admin-danger)]" : ""}`}>{late ? durationLabel(late) : "On time"}</p></div>
      </div>
      <p className="text-xs text-[var(--admin-muted)]">Date and time values are Cambodia local time: <strong>ICT — Asia/Phnom_Penh (UTC+7)</strong>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput control={form.control} name="actualReturnAt" label="Actual return — ICT" type="datetime-local" />
        <TextInput control={form.control} name="odometerKm" label="Return odometer (km)" type="number" min={pickupOdometer} description={`Pickup: ${pickupOdometer.toLocaleString()} km`} />
        <ChoiceSelect control={form.control} name="fuelLevel" label="Fuel level" options={fuelOptions} />
        <ChoiceSelect control={form.control} name="condition" label="Vehicle condition" options={conditionOptions} />
      </div>
      <fieldset><legend className="mb-2 text-sm font-bold">New damage found?</legend><div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={!values.newDamageFound ? "primary" : "outline"} className="min-h-11" onPress={() => form.setValue("newDamageFound", false, { shouldValidate: true })}>No</Button>
        <Button type="button" variant={values.newDamageFound ? "danger" : "outline"} className="min-h-11" onPress={() => form.setValue("newDamageFound", true, { shouldValidate: true })}>Yes</Button>
      </div></fieldset>
      <NotesField control={form.control} name="damageNotes" label="Damage notes" required={values.newDamageFound} placeholder={values.newDamageFound ? "Describe location and severity." : "Optional condition notes"} />
      <NotesField control={form.control} name="staffNotes" label="Staff notes" placeholder="Optional internal return notes" />
    </Drawer.Body>
    <Drawer.Footer className="grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white"><Button type="button" variant="tertiary" className="min-h-12" onPress={onClose}>Cancel</Button><Button type="submit" className="min-h-12" isPending={form.formState.isSubmitting}>Confirm Return</Button></Drawer.Footer>
  </Form>;
}

export function ReturnInspectionDrawer({ booking, isOpen, onOpenChange, onConfirm }: DrawerProps<ReturnInput>) {
  return <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><Drawer.Content placement="right" className="h-dvh w-full max-w-xl"><Drawer.Dialog aria-label="Return vehicle inspection"><Drawer.CloseTrigger /><Drawer.Header><Drawer.Heading>Return Vehicle · Inspection</Drawer.Heading></Drawer.Header>
    <ReturnFormBody key={booking.reference} booking={booking} onClose={() => onOpenChange(false)} onConfirm={onConfirm} />
  </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>;
}

export function CompleteBookingDialog({ booking, isOpen, onOpenChange, onConfirm }: { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<unknown> }) {
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
  return <AlertDialog><AlertDialog.Trigger className="hidden" aria-hidden>Open completion dialog</AlertDialog.Trigger><AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><AlertDialog.Container><AlertDialog.Dialog>
    <AlertDialog.Header><AlertDialog.Icon status="accent" /><AlertDialog.Heading>Complete booking {booking.reference}?</AlertDialog.Heading></AlertDialog.Header>
    <AlertDialog.Body className="space-y-4"><p className="text-sm text-[var(--admin-muted)]">Review the operational closure. Completing releases the vehicle unless it is inactive or has been moved to maintenance.</p>
      <dl className="adminTile grid gap-3 rounded-xl p-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[var(--admin-muted)]">Customer</dt><dd className="font-bold">{booking.customer.name}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Vehicle</dt><dd className="font-bold">{booking.vehicle.name}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Distance</dt><dd className="font-bold">{distance === null ? "—" : `${distance.toLocaleString()} km`}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Damage</dt><dd className="font-bold">{booking.returnInspection?.damageFound ? "New damage reported" : "None reported"}</dd></div></dl>
      <FormError message={error} />
    </AlertDialog.Body><AlertDialog.Footer><Button variant="tertiary" className="min-h-11" onPress={() => onOpenChange(false)}>Keep Returned</Button><Button className="min-h-11" isPending={pending} onPress={() => void confirm()}>Complete Booking</Button></AlertDialog.Footer>
  </AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog>;
}

