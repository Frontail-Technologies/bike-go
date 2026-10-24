"use client";

import { Alert, Button, Drawer, FieldError, Form, Input, Label, TextArea, TextField, useOverlayState } from "@heroui/react";
import { CalendarXIcon, PlusIcon, ShieldCheckIcon, TrashIcon, WrenchIcon, type Icon } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { ContentSection } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useVehicleBlockMutations, useVehicleBlocksQuery } from "../hooks/use-vehicles";
import { blockFormSchema as blockSchema, type BlockFormValues as BlockForm } from "../schemas/vehicle-schemas";
import type { VehicleBlock } from "../types/vehicle";

type FormErrors = Partial<Record<keyof BlockForm, string>>;
const emptyForm: BlockForm = { startAt: "", endAt: "", reason: "" };

function localCambodiaValueToIso(value: string) {
  return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}

function formatCambodiaDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

function blockIcon(reason: string): Icon {
  if (/inspect|safety/i.test(reason)) return ShieldCheckIcon;
  if (/maint|repair|service/i.test(reason)) return WrenchIcon;
  return CalendarXIcon;
}

export function AvailabilityBlocks({ vehicleId }: { vehicleId: string }) {
  const drawer = useOverlayState();
  const query = useVehicleBlocksQuery(vehicleId);
  const mutations = useVehicleBlockMutations(vehicleId);
  const blocks = query.data ?? [];
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<BlockForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [removing, setRemoving] = useState<VehicleBlock | null>(null);

  function change(field: keyof BlockForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = blockSchema.safeParse(form);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({ startAt: fields.startAt?.[0], endAt: fields.endAt?.[0], reason: fields.reason?.[0] });
      return;
    }
    setSubmitError("");
    try {
      await mutations.add.mutateAsync({ startAt: new Date(localCambodiaValueToIso(result.data.startAt)).toISOString(), endAt: new Date(localCambodiaValueToIso(result.data.endAt)).toISOString(), reason: result.data.reason.trim() });
      toast.success("Availability block added");
      setForm(emptyForm);
      setErrors({});
      drawer.close();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "The block could not be added. Try again.");
    }
  }

  async function removeBlock() {
    if (!removing) return;
    try {
      await mutations.remove.mutateAsync(removing.id);
      toast.success("Availability block removed");
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The block could not be removed.");
    }
    setRemoving(null);
  }

  return (
    <>
      <section aria-label="Vehicle availability"><ContentSection title="Availability & Maintenance" description="Periods when this vehicle should not be available." actions={<Button className="min-h-11" onPress={drawer.open}><PlusIcon />Add block</Button>}>
        <div className="space-y-4 p-4 sm:p-5">
          {query.isError ? <AdminErrorState title="Couldn’t load availability" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /> : query.isLoading ? <div role="status" aria-label="Loading availability" className="h-24 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" /> : blocks.length ? <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-[var(--admin-border)]">{blocks.map((block, index) => { const Icon = blockIcon(block.reason); return <li key={block.id} className="relative flex items-start gap-3"><span className={"relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full " + (index % 2 ? "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" : "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]")}><Icon size={19} weight="duotone" aria-hidden /></span><article className="adminTile flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl p-3.5"><div className="min-w-0"><h3 className="text-sm font-extrabold">{block.reason}</h3><dl className="mt-1.5 grid gap-x-6 gap-y-1 text-xs text-[var(--admin-muted)] sm:grid-cols-2"><div><dt className="inline font-medium">Start </dt><dd className="inline font-semibold text-[var(--admin-text)]">{formatCambodiaDateTime(block.startAt)}</dd></div><div><dt className="inline font-medium">End </dt><dd className="inline font-semibold text-[var(--admin-text)]">{formatCambodiaDateTime(block.endAt)}</dd></div></dl><p className="mt-1 text-[11px] text-[var(--admin-muted)]">ICT · Asia/Phnom_Penh</p></div><Button isIconOnly size="sm" variant="ghost" className="size-11 min-w-11 shrink-0" aria-label={"Remove availability block: " + block.reason} onPress={() => setRemoving(block)}><TrashIcon size={17} /></Button></article></li>; })}</ol> : <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-5 py-9 text-center"><p className="text-sm font-bold">No availability blocks</p><p className="mt-1 text-xs text-[var(--admin-muted)]">This vehicle has no scheduled blocks.</p></div>}
                  </div>
      </ContentSection></section>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={(open) => { drawer.setOpen(open); if (!open) { setErrors({}); setSubmitError(""); } }} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Add vehicle availability block">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Add availability block</Drawer.Heading></Drawer.Header>
            <Form validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="contents">
              <Drawer.Body className="space-y-5">
                {submitError ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Block was not added</Alert.Title><Alert.Description>{submitError}</Alert.Description></Alert.Content></Alert> : null}
                <p className="text-sm text-[var(--admin-muted)]">Enter Cambodia local time. All values below are interpreted as <strong>ICT — Asia/Phnom_Penh (UTC+7)</strong>.</p>
                <TextField name="startAt" isRequired value={form.startAt} onChange={(value) => change("startAt", value)} isInvalid={Boolean(errors.startAt)}><Label>Start date and time — ICT</Label><Input type="datetime-local"  /><FieldError>{errors.startAt}</FieldError></TextField>
                <TextField name="endAt" isRequired value={form.endAt} onChange={(value) => change("endAt", value)} isInvalid={Boolean(errors.endAt)}><Label>End date and time — ICT</Label><Input type="datetime-local"  /><FieldError>{errors.endAt}</FieldError></TextField>
                <TextField name="reason" isRequired value={form.reason} onChange={(value) => change("reason", value)} isInvalid={Boolean(errors.reason)}><Label>Reason</Label><TextArea rows={4} maxLength={200}  /><div className="flex justify-between text-xs text-[var(--admin-muted)]"><span>2–200 characters</span><span>{form.reason.length}/200</span></div><FieldError>{errors.reason}</FieldError></TextField>
              </Drawer.Body>
              <Drawer.Footer><Button type="button" variant="tertiary" onPress={drawer.close}>Cancel</Button><Button type="submit" isPending={mutations.add.isPending}>Add block</Button></Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
      <ConfirmationDialog isOpen={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(null); }} title="Remove availability block?" description="The vehicle becomes available for booking during this period again." confirmLabel="Remove block" danger onConfirm={removeBlock} />
    </>
  );
}
