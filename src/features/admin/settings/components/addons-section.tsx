"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Description, FieldError, Input, Label, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AdminSearch } from "@/components/admin/controls";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { CurrencyAmount } from "@/components/admin/money";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { useAddonMutations, useAddonsQuery } from "../hooks/use-addons";
import { addonSchema, type AddonValues } from "../schemas/addon-schema";
import type { Addon } from "../types/addon";
import { deactivateCopy, ItemRowActions } from "./item-row-actions";

const slug = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

function AddonForm({ addon, onClose }: { addon: Addon | null; onClose: () => void }) {
  const mutations = useAddonMutations();
  const [error, setError] = useState("");
  const form = useForm<AddonValues>({
    resolver: zodResolver(addonSchema),
    defaultValues: { name: addon?.name ?? "", code: addon?.code ?? "", description: addon?.description ?? "", price: addon ? String(addon.pricePerDayMinor / 100) : "", active: addon?.active ?? true },
  });

  const submit = form.handleSubmit(async (values) => {
    setError("");
    const pricePerDayMinor = Math.round(Number(values.price) * 100);
    const description = values.description.trim();
    try {
      if (addon) await mutations.update.mutateAsync({ id: addon.id, name: values.name, description: description || null, pricePerDayMinor, active: values.active });
      else await mutations.create.mutateAsync({ code: values.code || slug(values.name), name: values.name, description: description || null, pricePerDayMinor, currency: "USD", active: values.active });
      toast.success(addon ? `${values.name} updated` : `${values.name} added`);
      onClose();
    } catch (failureValue) {
      setError(failure(failureValue));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        {error ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Not saved</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Controller control={form.control} name="name" render={({ field, fieldState }) => (
          <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange} autoFocus>
            <Label>Name</Label>
            <Input />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )} />
        <Controller control={form.control} name="code" render={({ field, fieldState }) => (
          <TextField isDisabled={Boolean(addon)} isInvalid={Boolean(fieldState.error)} value={field.value} onChange={(value) => field.onChange(value.toUpperCase())}>
            <Label>Code</Label>
            <Input placeholder="generated from the name" />
            <Description>{addon ? "The code can’t be changed after the add-on is created." : "Upper-case letters, digits and underscores. Leave empty to generate it."}</Description>
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )} />
        <Controller control={form.control} name="description" render={({ field, fieldState }) => (
          <TextField isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange}>
            <Label>Description</Label>
            <TextArea rows={2} />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )} />
        <Controller control={form.control} name="price" render={({ field, fieldState }) => (
          <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange}>
            <Label>Price per day (USD)</Label>
            <Input type="number" inputMode="decimal" min="0" step="0.01" />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )} />
        <Controller control={form.control} name="active" render={({ field }) => (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--admin-border)] p-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]">
            <input type="checkbox" checked={field.value} onChange={(event) => field.onChange(event.target.checked)} className="size-4 accent-[#dcae00]" />
            Active
          </label>
        )} />
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner color="current" size="sm" /> : null}Save</Button>
      </Modal.Footer>
    </form>
  );
}

export function AddonsSection() {
  const query = useAddonsQuery();
  const mutations = useAddonMutations();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Addon | null>(null);
  const [open, setOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<Addon | null>(null);

  const term = search.trim().toLowerCase();
  const items = useMemo(() => (query.data ?? []).filter((addon) => !term || `${addon.name} ${addon.code}`.toLowerCase().includes(term)), [query.data, term]);

  function setActive(addon: Addon, active: boolean, onSettled?: () => void) {
    mutations.update.mutate({ id: addon.id, active }, { onSuccess: () => { toast.success(`${addon.name} ${active ? "activated" : "deactivated"}`); onSettled?.(); }, onError: (error) => toast.danger(failure(error)) });
  }

  return (
    <section aria-label="Add-ons" className="adminSurface rounded-2xl">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--admin-border)] p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold leading-tight">Add-ons {query.data ? <span className="ml-1 text-xs font-semibold text-[var(--admin-muted)]">{query.data.length}</span> : null}</h2>
          <p className="text-sm text-[var(--admin-muted)]">Extras customers can add to a booking, priced per day in USD.</p>
        </div>
        <Button variant="primary" className="min-h-11" onPress={() => { setEditing(null); setOpen(true); }}>
          <PlusIcon />
          Add add-on
        </Button>
      </header>
      {(query.data?.length ?? 0) > 6 ? (
        <div className="p-3 sm:px-5"><AdminSearch value={search} onChange={setSearch} placeholder="Search add-ons…" className="sm:max-w-xs" /></div>
      ) : null}

      {query.isError ? (
        <AdminErrorState title="Couldn’t load add-ons" description={failure(query.error)} onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <ul aria-label="Loading add-ons" aria-busy="true" className="divide-y divide-[var(--admin-border)]">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 px-4 py-4 sm:px-5"><span className="h-4 w-44 animate-pulse rounded bg-[var(--admin-surface-muted)]" /><span className="ml-auto h-6 w-16 animate-pulse rounded-full bg-[var(--admin-surface-muted)]" /></li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[var(--admin-muted)]">{term ? "No add-ons match this search." : "No add-ons yet. Add the first one."}</p>
      ) : (
        <ul aria-label="Add-ons" className="divide-y divide-[var(--admin-border)]">
          {items.map((addon) => (
            <li key={addon.id} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", !addon.active && "bg-[var(--admin-surface-muted)]/60")}>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-bold", !addon.active && "text-[var(--admin-muted)]")}>{addon.name}</p>
                <p className="truncate text-xs text-[var(--admin-muted)]">{addon.code}{addon.description ? ` · ${addon.description}` : ""}</p>
              </div>
              <div className="shrink-0 text-right"><CurrencyAmount amount={addon.pricePerDayMinor} currency={addon.currency} className="text-sm" /><p className="text-[11px] text-[var(--admin-muted)]">per day</p></div>
              <AdminStatusBadge status={addon.active ? "active" : "inactive"} />
              <ItemRowActions name={addon.name} active={addon.active} onEdit={() => { setEditing(addon); setOpen(true); }} onToggle={() => (addon.active ? setDeactivating(addon) : setActive(addon, true))} />
            </li>
          ))}
        </ul>
      )}

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen} className="adminOverlay">
        <Modal.Container size="md">
          <Modal.Dialog aria-label={editing ? "Edit add-on" : "Add add-on"}>
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>{editing ? "Edit" : "Add"} add-on</Modal.Heading></Modal.Header>
            <AddonForm key={editing?.id ?? "new"} addon={editing} onClose={() => setOpen(false)} />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      <ConfirmationDialog isOpen={Boolean(deactivating)} onOpenChange={(next) => !next && setDeactivating(null)} title={`Deactivate ${deactivating?.name ?? "add-on"}?`} description={deactivateCopy(deactivating?.name ?? "This add-on")} confirmLabel="Deactivate" danger isPending={mutations.update.isPending} onConfirm={() => { if (deactivating) setActive(deactivating, false, () => setDeactivating(null)); }} />
    </section>
  );
}
