"use client";

import { Alert, AlertDialog, Button, Description, Drawer, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { Checkbox } from "@/components/ui/selection-controls";
import { type Booking, type FuelLevel, type HandoverInspection, type ReturnInspection, type VehicleCondition, distanceTravelled, durationLabel, fmtDateTime, ictLocalToIso, isoToIctLocal, lateMinutes, NOW } from "./booking-data";

const fuelOptions: { value: FuelLevel; label: string }[] = [
  { value: "full", label: "Full" }, { value: "three_quarters", label: "3/4" }, { value: "half", label: "1/2" }, { value: "quarter", label: "1/4" }, { value: "empty", label: "Empty" },
];
const conditionOptions: { value: VehicleCondition; label: string }[] = [
  { value: "excellent", label: "Excellent" }, { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "needs_attention", label: "Needs attention" },
];

function BookingSummary({ booking }: { booking: Booking }) {
  return <dl className="adminTile grid gap-3 rounded-xl p-3 text-sm sm:grid-cols-2">
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Booking</dt><dd className="font-bold">{booking.reference}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Customer</dt><dd className="font-bold">{booking.customer.name}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Vehicle</dt><dd className="font-bold">{booking.vehicle.name}</dd></div>
    <div><dt className="text-[11px] text-[var(--admin-muted)]">Scheduled pickup</dt><dd className="font-bold">{fmtDateTime(booking.pickupAt)} ICT</dd></div>
  </dl>;
}

function ChoiceSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <Select value={value} onChange={(key) => key !== null && onChange(String(key) as T)}><Label>{label}</Label><Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover className="adminOverlay"><ListBox>{options.map((option) => <ListBox.Item key={option.value} id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>;
}

type HandoverForm = { actualPickupAt: string; odometerKm: string; fuelLevel: FuelLevel; condition: VehicleCondition; existingDamageNotes: string; photoNames: string[]; licenceVerified: boolean; identityVerified: boolean; depositVerified: boolean; staffNotes: string };
function HandoverFormBody({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (inspection: HandoverInspection) => void }) {
  const depositRequired = booking.vehicle.securityDepositMinor > 0;
  const [form, setForm] = useState<HandoverForm>({ actualPickupAt: isoToIctLocal(new Date(NOW).toISOString()), odometerKm: "", fuelLevel: "full", condition: "good", existingDamageNotes: "", photoNames: [], licenceVerified: false, identityVerified: false, depositVerified: !depositRequired, staffNotes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof HandoverForm>(key: K, value: HandoverForm[K]) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "", verification: "" })); };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.actualPickupAt) next.actualPickupAt = "Actual pickup date and time is required.";
    if (form.odometerKm === "" || Number(form.odometerKm) < 0) next.odometerKm = "Enter a valid odometer reading.";
    if (!form.licenceVerified || !form.identityVerified || (depositRequired && !form.depositVerified)) next.verification = "Complete every required verification before handover.";
    if (Object.keys(next).length) { setErrors(next); return; }
    onConfirm({ ...form, actualPickupAt: ictLocalToIso(form.actualPickupAt), odometerKm: Number(form.odometerKm) });
  }
  return <Form validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="contents">
    <Drawer.Body className="space-y-5 pb-8">
      <Alert status="accent"><Alert.Indicator /><Alert.Content><Alert.Title>Local mock operation</Alert.Title><Alert.Description>This handover is not saved and resets after reload.</Alert.Description></Alert.Content></Alert>
      <BookingSummary booking={booking} />
      <p className="text-xs text-[var(--admin-muted)]">Date and time values are Cambodia local time: <strong>ICT — Asia/Phnom_Penh (UTC+7)</strong>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired value={form.actualPickupAt} onChange={(value) => set("actualPickupAt", value)} isInvalid={Boolean(errors.actualPickupAt)}><Label>Actual pickup — ICT</Label><Input type="datetime-local" /><FieldError>{errors.actualPickupAt}</FieldError></TextField>
        <TextField isRequired value={form.odometerKm} onChange={(value) => set("odometerKm", value)} isInvalid={Boolean(errors.odometerKm)}><Label>Current odometer (km)</Label><Input type="number" min="0" inputMode="numeric" placeholder="e.g. 12480" /><FieldError>{errors.odometerKm}</FieldError></TextField>
        <ChoiceSelect label="Fuel level" value={form.fuelLevel} options={fuelOptions} onChange={(value) => set("fuelLevel", value)} />
        <ChoiceSelect label="Vehicle condition" value={form.condition} options={conditionOptions} onChange={(value) => set("condition", value)} />
      </div>
      <TextField value={form.existingDamageNotes} onChange={(value) => set("existingDamageNotes", value)}><Label>Existing damage notes</Label><TextArea rows={3} placeholder="Record scratches, dents, or write ‘None’." /></TextField>
      <div><Label className="mb-2 block text-sm font-semibold">Pickup photos</Label><ImageUploader limit={4} maxSizeMb={5} aspectClass="aspect-[16/7]" emptyTitle="Add pickup inspection photos" emptyHint="Local preview only · JPG, PNG or WebP" onChange={(files) => set("photoNames", files.map((file) => file.name))} /></div>
      <fieldset className="space-y-1"><legend className="mb-1 text-sm font-bold">Required verification</legend>
        <Checkbox isSelected={form.licenceVerified} onChange={(value) => set("licenceVerified", value)}>Driving licence verified</Checkbox>
        <Checkbox isSelected={form.identityVerified} onChange={(value) => set("identityVerified", value)}>Customer identity verified</Checkbox>
        {depositRequired ? <Checkbox isSelected={form.depositVerified} onChange={(value) => set("depositVerified", value)}>Security deposit received / verified</Checkbox> : null}
        {errors.verification ? <p role="alert" className="text-xs font-semibold text-[var(--admin-danger)]">{errors.verification}</p> : null}
      </fieldset>
      <TextField value={form.staffNotes} onChange={(value) => set("staffNotes", value)}><Label>Staff notes</Label><TextArea rows={3} placeholder="Optional internal handover notes" /></TextField>
    </Drawer.Body>
    <Drawer.Footer className="grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white"><Button type="button" variant="tertiary" className="min-h-12" onPress={onClose}>Cancel</Button><Button type="submit" className="min-h-12">Confirm Handover</Button></Drawer.Footer>
  </Form>;
}

export function HandoverDrawer({ booking, isOpen, onOpenChange, onConfirm }: { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (inspection: HandoverInspection) => void }) {
  return <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><Drawer.Content placement="right" className="h-dvh w-full max-w-xl"><Drawer.Dialog aria-label="Start rental vehicle handover"><Drawer.CloseTrigger /><Drawer.Header><Drawer.Heading>Start Rental · Vehicle Handover</Drawer.Heading></Drawer.Header>{isOpen ? <HandoverFormBody key={`${booking.reference}-${isOpen}`} booking={booking} onClose={() => onOpenChange(false)} onConfirm={(inspection) => { onConfirm(inspection); onOpenChange(false); }} /> : null}</Drawer.Dialog></Drawer.Content></Drawer.Backdrop>;
}

type ReturnForm = { actualReturnAt: string; odometerKm: string; fuelLevel: FuelLevel; condition: VehicleCondition; newDamageFound: boolean; damageNotes: string; photoNames: string[]; staffNotes: string };
function ReturnFormBody({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: (inspection: ReturnInspection) => void }) {
  const pickupOdometer = booking.handover?.odometerKm ?? 0;
  const [form, setForm] = useState<ReturnForm>({ actualReturnAt: isoToIctLocal(new Date(NOW).toISOString()), odometerKm: String(pickupOdometer), fuelLevel: "three_quarters", condition: "good", newDamageFound: false, damageNotes: "", photoNames: [], staffNotes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof ReturnForm>(key: K, value: ReturnForm[K]) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); };
  const preview: Booking = { ...booking, returnInspection: form.actualReturnAt && form.odometerKm !== "" ? { ...form, actualReturnAt: ictLocalToIso(form.actualReturnAt), odometerKm: Number(form.odometerKm) } : null };
  const distance = distanceTravelled(preview);
  const late = lateMinutes(preview);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next: Record<string, string> = {};
    if (!form.actualReturnAt) next.actualReturnAt = "Actual return date and time is required.";
    else if (booking.handover && Date.parse(ictLocalToIso(form.actualReturnAt)) < Date.parse(booking.handover.actualPickupAt)) next.actualReturnAt = "Actual return must be after the vehicle handover.";
    if (form.odometerKm === "" || Number(form.odometerKm) < pickupOdometer) next.odometerKm = `Return mileage must be at least ${pickupOdometer.toLocaleString()} km.`;
    if (form.newDamageFound && !form.damageNotes.trim()) next.damageNotes = "Describe the new damage found.";
    if (Object.keys(next).length) { setErrors(next); return; }
    onConfirm({ ...form, actualReturnAt: ictLocalToIso(form.actualReturnAt), odometerKm: Number(form.odometerKm) });
  }
  return <Form validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="contents">
    <Drawer.Body className="space-y-5 pb-8">
      <Alert status="accent"><Alert.Indicator /><Alert.Content><Alert.Title>Local mock operation</Alert.Title><Alert.Description>This return inspection is not saved and resets after reload.</Alert.Description></Alert.Content></Alert>
      <BookingSummary booking={booking} />
      <div className="grid gap-2 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-xs sm:grid-cols-3">
        <div><p className="text-[var(--admin-muted)]">Scheduled return</p><p className="font-bold">{fmtDateTime(booking.returnAt)} ICT</p></div>
        <div><p className="text-[var(--admin-muted)]">Distance travelled</p><p className="font-bold">{distance === null ? "—" : `${distance.toLocaleString()} km`}</p></div>
        <div><p className="text-[var(--admin-muted)]">Late return</p><p className={`font-bold ${late ? "text-[var(--admin-danger)]" : ""}`}>{late ? durationLabel(late) : "On time"}</p></div>
      </div>
      <p className="text-xs text-[var(--admin-muted)]">Date and time values are Cambodia local time: <strong>ICT — Asia/Phnom_Penh (UTC+7)</strong>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired value={form.actualReturnAt} onChange={(value) => set("actualReturnAt", value)} isInvalid={Boolean(errors.actualReturnAt)}><Label>Actual return — ICT</Label><Input type="datetime-local" /><FieldError>{errors.actualReturnAt}</FieldError></TextField>
        <TextField isRequired value={form.odometerKm} onChange={(value) => set("odometerKm", value)} isInvalid={Boolean(errors.odometerKm)}><Label>Return odometer (km)</Label><Input type="number" min={pickupOdometer} inputMode="numeric" /><Description>Pickup: {pickupOdometer.toLocaleString()} km</Description><FieldError>{errors.odometerKm}</FieldError></TextField>
        <ChoiceSelect label="Fuel level" value={form.fuelLevel} options={fuelOptions} onChange={(value) => set("fuelLevel", value)} />
        <ChoiceSelect label="Vehicle condition" value={form.condition} options={conditionOptions} onChange={(value) => set("condition", value)} />
      </div>
      <fieldset><legend className="mb-2 text-sm font-bold">New damage found?</legend><div className="grid grid-cols-2 gap-2"><Button type="button" variant={!form.newDamageFound ? "primary" : "outline"} className="min-h-11" onPress={() => set("newDamageFound", false)}>No</Button><Button type="button" variant={form.newDamageFound ? "danger" : "outline"} className="min-h-11" onPress={() => set("newDamageFound", true)}>Yes</Button></div></fieldset>
      <TextField value={form.damageNotes} onChange={(value) => set("damageNotes", value)} isInvalid={Boolean(errors.damageNotes)} isRequired={form.newDamageFound}><Label>Damage notes</Label><TextArea rows={3} placeholder={form.newDamageFound ? "Describe location and severity." : "Optional condition notes"} /><FieldError>{errors.damageNotes}</FieldError></TextField>
      <div><Label className="mb-2 block text-sm font-semibold">Return photos</Label><ImageUploader limit={4} maxSizeMb={5} aspectClass="aspect-[16/7]" emptyTitle="Add return inspection photos" emptyHint="Local preview only · JPG, PNG or WebP" onChange={(files) => set("photoNames", files.map((file) => file.name))} /></div>
      <TextField value={form.staffNotes} onChange={(value) => set("staffNotes", value)}><Label>Staff notes</Label><TextArea rows={3} placeholder="Optional internal return notes" /></TextField>
    </Drawer.Body>
    <Drawer.Footer className="grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white"><Button type="button" variant="tertiary" className="min-h-12" onPress={onClose}>Cancel</Button><Button type="submit" className="min-h-12">Confirm Return</Button></Drawer.Footer>
  </Form>;
}

export function ReturnInspectionDrawer({ booking, isOpen, onOpenChange, onConfirm }: { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (inspection: ReturnInspection) => void }) {
  return <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><Drawer.Content placement="right" className="h-dvh w-full max-w-xl"><Drawer.Dialog aria-label="Return vehicle inspection"><Drawer.CloseTrigger /><Drawer.Header><Drawer.Heading>Return Vehicle · Inspection</Drawer.Heading></Drawer.Header>{isOpen ? <ReturnFormBody key={`${booking.reference}-${isOpen}`} booking={booking} onClose={() => onOpenChange(false)} onConfirm={(inspection) => { onConfirm(inspection); onOpenChange(false); }} /> : null}</Drawer.Dialog></Drawer.Content></Drawer.Backdrop>;
}

export function CompleteBookingDialog({ booking, isOpen, onOpenChange, onConfirm }: { booking: Booking; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  const distance = distanceTravelled(booking);
  return <AlertDialog><AlertDialog.Trigger className="hidden" aria-hidden>Open completion dialog</AlertDialog.Trigger><AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay"><AlertDialog.Container><AlertDialog.Dialog>
    <AlertDialog.Header><AlertDialog.Icon status="accent" /><AlertDialog.Heading>Complete booking {booking.reference}?</AlertDialog.Heading></AlertDialog.Header>
    <AlertDialog.Body className="space-y-4"><p className="text-sm text-[var(--admin-muted)]">Review the operational closure. Completing releases the vehicle unless it is inactive or has been moved to maintenance.</p>
      <dl className="adminTile grid gap-3 rounded-xl p-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[var(--admin-muted)]">Customer</dt><dd className="font-bold">{booking.customer.name}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Vehicle</dt><dd className="font-bold">{booking.vehicle.name}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Rental period</dt><dd className="font-bold">{fmtDateTime(booking.pickupAt)} – {fmtDateTime(booking.returnAt)}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Return status</dt><dd className="font-bold">Returned · {distance ?? 0} km</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Damage</dt><dd className="font-bold">{booking.returnInspection?.newDamageFound ? booking.returnInspection.damageNotes : "No new damage"}</dd></div><div><dt className="text-xs text-[var(--admin-muted)]">Security deposit</dt><dd className="font-bold">{booking.vehicle.securityDepositMinor ? booking.handover?.depositVerified ? "Verified" : "Not verified" : "Not required"}</dd></div></dl>
    </AlertDialog.Body><AlertDialog.Footer><Button variant="tertiary" slot="close" className="min-h-11">Keep Returned</Button><Button slot="close" className="min-h-11" onPress={onConfirm}>Complete Booking</Button></AlertDialog.Footer>
  </AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog>;
}
