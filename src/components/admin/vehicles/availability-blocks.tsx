"use client";

import { Alert, Button, Drawer, FieldError, Form, Input, Label, TextArea, TextField, useOverlayState } from "@heroui/react";
import { CalendarXIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { z } from "zod";
import { adminVehicleAvailability, type VehicleAvailabilityBlock } from "@/components/admin/data";
import { ConfirmationDialog } from "@/components/admin/feedback";
import { ContentSection } from "@/components/admin/layout";

const blockSchema = z.object({
  startAt: z.string().min(1, "Start date and time is required."),
  endAt: z.string().min(1, "End date and time is required."),
  reason: z.string().trim().min(2, "Reason must contain at least 2 characters.").max(200, "Reason must contain no more than 200 characters."),
}).refine((value) => !value.startAt || !value.endAt || value.endAt > value.startAt, { path: ["endAt"], message: "End date and time must be after the start." });

type BlockForm = z.infer<typeof blockSchema>;
type FormErrors = Partial<Record<keyof BlockForm, string>>;
const emptyForm: BlockForm = { startAt: "", endAt: "", reason: "" };

function localCambodiaValueToIso(value: string) {
  return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}

function formatCambodiaDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

export function AvailabilityBlocks({ vehicleId }: { vehicleId: string }) {
  const drawer = useOverlayState();
  const [blocks, setBlocks] = useState(() => adminVehicleAvailability.filter((block) => block.vehicleId === vehicleId));
  const [form, setForm] = useState<BlockForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [removing, setRemoving] = useState<VehicleAvailabilityBlock | null>(null);

  function change(field: keyof BlockForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = blockSchema.safeParse(form);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({ startAt: fields.startAt?.[0], endAt: fields.endAt?.[0], reason: fields.reason?.[0] });
      return;
    }
    setBlocks((current) => [...current, { id: `local-${Date.now()}`, vehicleId, startAt: localCambodiaValueToIso(result.data.startAt), endAt: localCambodiaValueToIso(result.data.endAt), reason: result.data.reason.trim() }]);
    setForm(emptyForm);
    setErrors({});
    drawer.close();
  }

  function removeBlock() {
    if (!removing) return;
    setBlocks((current) => current.filter((block) => block.id !== removing.id));
    setRemoving(null);
  }

  return (
    <>
      <section aria-label="Vehicle availability"><ContentSection title="Availability blocks" description="Temporarily mark periods when this vehicle should not be available." actions={<Button onPress={drawer.open}><PlusIcon />Add block</Button>}>
        <div className="space-y-4 p-5">
          <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Mock UI only — changes are not saved</Alert.Title><Alert.Description>Availability additions and removals remain in this browser session and reset when the page reloads.</Alert.Description></Alert.Content></Alert>
          {blocks.length ? <div className="grid gap-3 lg:grid-cols-2">{blocks.map((block) => <article key={block.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-white p-4"><div className="min-w-0"><div className="flex items-center gap-2"><CalendarXIcon className="shrink-0 text-[var(--admin-warning)]" size={19} /><h3 className="text-sm font-extrabold">Unavailable</h3></div><p className="mt-2 text-sm font-semibold">{formatCambodiaDateTime(block.startAt)} – {formatCambodiaDateTime(block.endAt)}</p><p className="mt-1 text-xs font-medium text-[var(--admin-muted)]">ICT — Asia/Phnom_Penh</p><p className="mt-3 text-sm text-[var(--admin-muted)]">{block.reason}</p></div><Button isIconOnly size="sm" variant="ghost" aria-label={`Remove availability block: ${block.reason}`} onPress={() => setRemoving(block)}><TrashIcon size={17} /></Button></article>)}</div> : <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-5 py-9 text-center"><p className="text-sm font-bold">No availability blocks</p><p className="mt-1 text-xs text-[var(--admin-muted)]">This vehicle has no local scheduling restrictions.</p></div>}
        </div>
      </ContentSection></section>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={(open) => { drawer.setOpen(open); if (!open) setErrors({}); }} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Add vehicle availability block">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Add availability block</Drawer.Heading></Drawer.Header>
            <Form validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="contents">
              <Drawer.Body className="space-y-5">
                <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Not persisted</Alert.Title><Alert.Description>This block is a local UI preview and will reset on reload.</Alert.Description></Alert.Content></Alert>
                <p className="text-sm text-[var(--admin-muted)]">Enter Cambodia local time. All values below are interpreted as <strong>ICT — Asia/Phnom_Penh (UTC+7)</strong>.</p>
                <TextField name="startAt" isRequired value={form.startAt} onChange={(value) => change("startAt", value)} isInvalid={Boolean(errors.startAt)}><Label>Start date and time — ICT</Label><Input type="datetime-local" variant="secondary" /><FieldError>{errors.startAt}</FieldError></TextField>
                <TextField name="endAt" isRequired value={form.endAt} onChange={(value) => change("endAt", value)} isInvalid={Boolean(errors.endAt)}><Label>End date and time — ICT</Label><Input type="datetime-local" variant="secondary" /><FieldError>{errors.endAt}</FieldError></TextField>
                <TextField name="reason" isRequired value={form.reason} onChange={(value) => change("reason", value)} isInvalid={Boolean(errors.reason)}><Label>Reason</Label><TextArea rows={4} maxLength={200} variant="secondary" /><div className="flex justify-between text-xs text-[var(--admin-muted)]"><span>2–200 characters</span><span>{form.reason.length}/200</span></div><FieldError>{errors.reason}</FieldError></TextField>
              </Drawer.Body>
              <Drawer.Footer><Button type="button" variant="tertiary" onPress={drawer.close}>Cancel</Button><Button type="submit">Add block</Button></Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
      <ConfirmationDialog isOpen={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(null); }} title="Remove availability block?" description="This removes the block from the local preview only. No saved data will be changed." confirmLabel="Remove block" danger onConfirm={removeBlock} />
    </>
  );
}
