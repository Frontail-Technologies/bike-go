"use client";

import { Alert, Drawer, FieldError, Form, Input, Label, TextArea, TextField, useOverlayState } from "@heroui/react";
import { CalendarXIcon, PlusIcon, ShieldCheckIcon, TrashIcon, WrenchIcon, type Icon } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { AdminButton as Button } from "@/components/admin/controls";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { ContentSection } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useVehicleBlockMutations, useVehicleBlocksQuery } from "../hooks/use-vehicles";
import { blockFormSchema as blockSchema, type BlockFormValues as BlockForm } from "../schemas/vehicle-schemas";
import type { VehicleBlock } from "../types/vehicle";
import { formatDateTime as formatCambodiaDateTime, ictLocalToIso } from "@/lib/date";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

type FormErrors = Partial<Record<keyof BlockForm, string>>;
const emptyForm: BlockForm = { startAt: "", endAt: "", reason: "" };


function blockIcon(reason: string): Icon {
  if (/inspect|safety/i.test(reason)) return ShieldCheckIcon;
  if (/maint|repair|service/i.test(reason)) return WrenchIcon;
  return CalendarXIcon;
}

export function AvailabilityBlocks({ vehicleId }: { vehicleId: string }) {
  const t = useAdminTranslations();
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
      await mutations.add.mutateAsync({ startAt: ictLocalToIso(result.data.startAt), endAt: ictLocalToIso(result.data.endAt), reason: result.data.reason.trim() });
      toast.success(t("vehicles.blocks.added"));
      setForm(emptyForm);
      setErrors({});
      drawer.close();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : t("vehicles.blocks.addError"));
    }
  }

  async function removeBlock() {
    if (!removing) return;
    try {
      await mutations.remove.mutateAsync(removing.id);
      toast.success(t("vehicles.blocks.removed"));
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : t("vehicles.blocks.removeError"));
    }
    setRemoving(null);
  }

  return (
    <>
      <section aria-label={t("vehicles.blocks.section")}><ContentSection title={t("vehicles.blocks.title")} description={t("vehicles.blocks.description")} actions={<Button className="min-h-11" onPress={drawer.open}><PlusIcon />{t("vehicles.blocks.add")}</Button>}>
        <div className="space-y-4 p-4 sm:p-5">
          {query.isError ? <AdminErrorState title={t("vehicles.blocks.loadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} /> : query.isLoading ? <div role="status" aria-label={t("vehicles.blocks.loading")} className="h-24 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" /> : blocks.length ? <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-[var(--admin-border)]">{blocks.map((block, index) => { const Icon = blockIcon(block.reason); return <li key={block.id} className="relative flex items-start gap-3"><span className={"relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full " + (index % 2 ? "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" : "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]")}><Icon size={19} weight="duotone" aria-hidden /></span><article className="adminTile flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl p-3.5"><div className="min-w-0"><h3 className="text-sm font-extrabold">{block.reason}</h3><dl className="mt-1.5 grid gap-x-6 gap-y-1 text-xs text-[var(--admin-muted)] sm:grid-cols-2"><div><dt className="inline font-medium">{t("vehicles.blocks.start")}</dt><dd className="inline font-semibold text-[var(--admin-text)]">{formatCambodiaDateTime(block.startAt)}</dd></div><div><dt className="inline font-medium">{t("vehicles.blocks.end")}</dt><dd className="inline font-semibold text-[var(--admin-text)]">{formatCambodiaDateTime(block.endAt)}</dd></div></dl><p className="mt-1 text-[11px] text-[var(--admin-muted)]">{t("common.ict")}</p></div><Button isIconOnly size="sm" variant="ghost" className="size-11 min-w-11 shrink-0" aria-label={t("vehicles.blocks.remove", { reason: block.reason })} onPress={() => setRemoving(block)}><TrashIcon size={17} /></Button></article></li>; })}</ol> : <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-5 py-9 text-center"><p className="text-sm font-bold">{t("vehicles.blocks.empty")}</p><p className="mt-1 text-xs text-[var(--admin-muted)]">{t("vehicles.blocks.emptyDescription")}</p></div>}
                  </div>
      </ContentSection></section>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={(open) => { drawer.setOpen(open); if (!open) { setErrors({}); setSubmitError(""); } }} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label={t("vehicles.blocks.drawerLabel")}>
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>{t("vehicles.blocks.drawerTitle")}</Drawer.Heading></Drawer.Header>
            <Form validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="contents">
              <Drawer.Body className="space-y-5">
                {submitError ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{t("vehicles.blocks.notAdded")}</Alert.Title><Alert.Description>{submitError}</Alert.Description></Alert.Content></Alert> : null}
                <p className="text-sm text-[var(--admin-muted)]">{t("vehicles.blocks.timeHintBefore")}<strong>{t("vehicles.blocks.timeHintZone")}</strong>.</p>
                <TextField name="startAt" isRequired value={form.startAt} onChange={(value) => change("startAt", value)} isInvalid={Boolean(errors.startAt)}><Label>{t("vehicles.blocks.startLabel")}</Label><Input type="datetime-local"  /><FieldError>{errors.startAt}</FieldError></TextField>
                <TextField name="endAt" isRequired value={form.endAt} onChange={(value) => change("endAt", value)} isInvalid={Boolean(errors.endAt)}><Label>{t("vehicles.blocks.endLabel")}</Label><Input type="datetime-local"  /><FieldError>{errors.endAt}</FieldError></TextField>
                <TextField name="reason" isRequired value={form.reason} onChange={(value) => change("reason", value)} isInvalid={Boolean(errors.reason)}><Label>{t("vehicles.blocks.reason")}</Label><TextArea rows={4} maxLength={200}  /><div className="flex justify-between text-xs text-[var(--admin-muted)]"><span>{t("common.characters", { min: 2, max: 200 })}</span><span>{form.reason.length}/200</span></div><FieldError>{errors.reason}</FieldError></TextField>
              </Drawer.Body>
              <Drawer.Footer><Button type="button" variant="tertiary" onPress={drawer.close}>{t("common.cancel")}</Button><Button type="submit" isPending={mutations.add.isPending}>{t("vehicles.blocks.add")}</Button></Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
      <ConfirmationDialog isOpen={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(null); }} title={t("vehicles.blocks.removeTitle")} description={t("vehicles.blocks.removeDescription")} confirmLabel={t("vehicles.blocks.removeConfirm")} danger isPending={mutations.remove.isPending} onConfirm={removeBlock} />
    </>
  );
}
