"use client";

import { Button, Description, Dropdown, FieldError, Input, Label, ListBox, Modal, Select, TextArea, TextField, useOverlayState } from "@heroui/react";
import { ArrowDownIcon, ArrowUpIcon, ArrowsClockwiseIcon, DotsThreeVerticalIcon, ImageIcon, LockSimpleIcon, NotePencilIcon, PlusIcon, PowerIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { AdminSearch } from "@/components/admin/controls";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { CurrencyAmount, type CurrencyCode } from "@/components/admin/money";
import { cn } from "@/lib/cn";
import type { MasterItem } from "./settings-data";

export type MasterField = "name" | "code" | "description" | "price" | "image";

const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

type DialogValues = { name: string; code: string; description: string; price: string; currency: CurrencyCode; imageUrl: string | null; active: boolean };
const blank: DialogValues = { name: "", code: "", description: "", price: "", currency: "USD", imageUrl: null, active: true };
const toValues = (item: MasterItem): DialogValues => ({ name: item.name, code: item.code, description: item.description ?? "", price: item.priceMinor === undefined ? "" : String(item.currency === "KHR" ? item.priceMinor : item.priceMinor / 100), currency: item.currency ?? "USD", imageUrl: item.imageUrl ?? null, active: item.active });

function MasterDataDialog({ noun, fields, items, editing, isOpen, onOpenChange, onSave }: { noun: string; fields: MasterField[]; items: MasterItem[]; editing: MasterItem | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (values: DialogValues, editing: MasterItem | null) => void }) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label={`${editing ? "Edit" : "Add"} ${noun}`}>
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{editing ? "Edit" : "Add"} {noun}</Modal.Heading></Modal.Header>
          <DialogForm key={editing?.id ?? "new"} noun={noun} fields={fields} items={items} editing={editing} onClose={() => onOpenChange(false)} onSave={onSave} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function DialogForm({ noun, fields, items, editing, onClose, onSave }: { noun: string; fields: MasterField[]; items: MasterItem[]; editing: MasterItem | null; onClose: () => void; onSave: (values: DialogValues, editing: MasterItem | null) => void }) {
  const [values, setValues] = useState<DialogValues>(() => (editing ? toValues(editing) : blank));
  const [errors, setErrors] = useState<Partial<Record<keyof DialogValues, string>>>({});
  const set = <K extends keyof DialogValues>(key: K, value: DialogValues[K]) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    const name = values.name.trim();
    if (name.length < 2) next.name = "Enter at least 2 characters.";
    else if (items.some((item) => item.id !== editing?.id && item.name.toLowerCase() === name.toLowerCase())) next.name = `A ${noun} with this name already exists.`;
    if (fields.includes("price")) {
      const price = Number(values.price);
      if (!values.price || !Number.isFinite(price) || price <= 0) next.price = "Enter a price greater than zero.";
    }
    if (Object.keys(next).length) { setErrors(next); return; }
    onSave({ ...values, name, code: values.code.trim() || slug(name) }, editing);
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        <TextField isRequired isInvalid={Boolean(errors.name)} value={values.name} onChange={(value) => set("name", value)} autoFocus><Label>Name</Label><Input /><FieldError>{errors.name}</FieldError></TextField>
        {fields.includes("code") ? <TextField value={values.code} onChange={(value) => set("code", value)}><Label>Code</Label><Input placeholder={slug(values.name) || "generated from the name"} /><Description>Used internally. Leave empty to generate it.</Description></TextField> : null}
        {fields.includes("description") ? <TextField value={values.description} onChange={(value) => set("description", value)}><Label>Description</Label><TextArea rows={2} /></TextField> : null}
        {fields.includes("price") ? (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <TextField isRequired isInvalid={Boolean(errors.price)} value={values.price} onChange={(value) => set("price", value)}><Label>Price per day</Label><Input type="number" inputMode="decimal" min="0" /><FieldError>{errors.price}</FieldError></TextField>
            <Select value={values.currency} onChange={(key) => key !== null && set("currency", String(key) as CurrencyCode)}>
              <Label>Currency</Label>
              <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover className="adminOverlay"><ListBox>{(["USD", "KHR"] as const).map((value) => <ListBox.Item key={value} id={value} textValue={value}>{value}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            </Select>
          </div>
        ) : null}
        {fields.includes("image") ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Image</p>
            {values.imageUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]"><Image src={values.imageUrl} alt={values.name || "Category image"} fill unoptimized className="object-cover" /></div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="min-h-11 md:min-h-9" onPress={() => set("imageUrl", null)}><ArrowsClockwiseIcon size={15} />Replace image</Button>
                  <Button type="button" variant="ghost" size="sm" className="min-h-11 text-[var(--admin-danger)] md:min-h-9" onPress={() => set("imageUrl", null)}><TrashIcon size={15} />Remove</Button>
                </div>
              </div>
            ) : (
              <ImageUploader limit={1} maxSizeMb={5} aspectClass="aspect-[16/9]" emptyTitle="Click to upload category image" emptyHint="or drag and drop · JPG, PNG or WebP · up to 5 MB" onChange={(files) => set("imageUrl", files[0] ? URL.createObjectURL(files[0]) : null)} />
            )}
          </div>
        ) : null}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--admin-border)] p-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]">
          <input type="checkbox" checked={values.active} onChange={(event) => set("active", event.target.checked)} className="size-4 accent-[#dcae00]" />Active
          <span className="text-xs font-normal text-[var(--admin-muted)]">Inactive items stay on existing records but can’t be picked for new ones.</span>
        </label>
        <p className="text-xs text-[var(--admin-muted)]">Demo only — changes reset after reload.</p>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11">Save</Button>
      </Modal.Footer>
    </form>
  );
}

type MasterDataSectionProps = { title: string; description: string; noun: string; initial: MasterItem[]; fields?: MasterField[]; reorder?: boolean; allowAdd?: boolean; allowEdit?: boolean };

export function MasterDataSection({ title, description, noun, initial, fields = ["name", "code"], reorder = false, allowAdd = true, allowEdit = true }: MasterDataSectionProps) {
  const dialog = useOverlayState();
  const [items, setItems] = useState<MasterItem[]>(initial);
  const [editing, setEditing] = useState<MasterItem | null>(null);
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const visible = items.filter((item) => !term || `${item.name} ${item.code}`.toLowerCase().includes(term));
  const canReorder = reorder && !term;

  function save(values: DialogValues, current: MasterItem | null) {
    const price = fields.includes("price") ? (values.currency === "KHR" ? Math.round(Number(values.price)) : Math.round(Number(values.price) * 100)) : undefined;
    const patch = { name: values.name, code: values.code, description: values.description.trim() || undefined, imageUrl: fields.includes("image") ? values.imageUrl ?? undefined : undefined, active: values.active, ...(price === undefined ? {} : { priceMinor: price, currency: values.currency }) };
    setItems((list) => current ? list.map((item) => item.id === current.id ? { ...item, ...patch } : item) : [...list, { id: `${slug(values.name)}-${list.length + 1}`, ...patch }]);
  }
  const toggle = (item: MasterItem) => setItems((list) => list.map((entry) => entry.id === item.id ? { ...entry, active: !entry.active } : entry));
  function move(item: MasterItem, direction: -1 | 1) {
    setItems((list) => { const index = list.findIndex((entry) => entry.id === item.id); const target = index + direction; if (target < 0 || target >= list.length) return list; const next = [...list]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  const openAdd = () => { setEditing(null); dialog.open(); };
  const openEdit = (item: MasterItem) => { setEditing(item); dialog.open(); };

  return (
    <section aria-label={title} className="adminSurface rounded-2xl">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--admin-border)] p-4 sm:p-5">
        <div className="min-w-0 flex-1"><h2 className="text-base font-extrabold leading-tight">{title} <span className="ml-1 text-xs font-semibold text-[var(--admin-muted)]">{items.length}</span></h2><p className="text-sm text-[var(--admin-muted)]">{description}</p></div>
        {allowAdd ? <Button variant="primary" className="min-h-11" onPress={openAdd}><PlusIcon />Add {noun}</Button> : null}
      </header>
      {items.length > 6 ? <div className="border-b border-[var(--admin-border)] p-3 sm:px-5"><AdminSearch value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}…`} className="sm:max-w-sm" /></div> : null}
      <ul aria-label={title} className="divide-y divide-[var(--admin-border)]">
        {visible.map((item) => {
          const index = items.findIndex((entry) => entry.id === item.id);
          return (
            <li key={item.id} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", !item.active && "bg-[var(--admin-surface-muted)]/60")}>
              {fields.includes("image") ? <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill unoptimized className="object-cover" /> : <ImageIcon size={20} weight="duotone" aria-hidden />}</span> : null}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-bold", !item.active && "text-[var(--admin-muted)]")}>{item.name}</p>
                <p className="truncate text-xs text-[var(--admin-muted)]">{fields.includes("code") ? <span>{item.code}</span> : null}{item.description ? <span>{fields.includes("code") ? " · " : ""}{item.description}</span> : null}</p>
              </div>
              {item.priceMinor !== undefined && item.currency ? <div className="shrink-0 text-right"><CurrencyAmount amount={item.priceMinor} currency={item.currency} className="text-sm" /><p className="text-[11px] text-[var(--admin-muted)]">per day · {item.currency}</p></div> : null}
              <AdminStatusBadge status={item.active ? "active" : "inactive"} />
              <Dropdown>
                <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${item.name}`} className="size-11 min-w-11 md:size-9 md:min-w-9"><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
                <Dropdown.Popover className="adminOverlay">
                  <Dropdown.Menu aria-label={`Actions for ${item.name}`}>
                    {allowEdit ? <Dropdown.Item id="edit" textValue="Edit" onAction={() => openEdit(item)}><NotePencilIcon size={16} /><Label>Edit</Label></Dropdown.Item> : null}
                    <Dropdown.Item id="toggle" textValue={item.active ? "Deactivate" : "Activate"} variant={item.active ? "danger" : "default"} onAction={() => toggle(item)}><PowerIcon size={16} /><Label>{item.active ? "Deactivate" : "Activate"}</Label></Dropdown.Item>
                    {canReorder && index > 0 ? <Dropdown.Item id="up" textValue="Move up" onAction={() => move(item, -1)}><ArrowUpIcon size={16} /><Label>Move up</Label></Dropdown.Item> : null}
                    {canReorder && index < items.length - 1 ? <Dropdown.Item id="down" textValue="Move down" onAction={() => move(item, 1)}><ArrowDownIcon size={16} /><Label>Move down</Label></Dropdown.Item> : null}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </li>
          );
        })}
        {!visible.length ? <li className="px-5 py-8 text-center text-sm text-[var(--admin-muted)]">Nothing matches “{search}”.</li> : null}
      </ul>
      {allowAdd || allowEdit ? <MasterDataDialog noun={noun} fields={fields} items={items} editing={editing} isOpen={dialog.isOpen} onOpenChange={dialog.setOpen} onSave={save} /> : null}
    </section>
  );
}

export function ReadOnlyList({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <section aria-label={title} className="adminSurface rounded-2xl p-4 sm:p-5">
      <header className="mb-4"><h2 className="flex items-center gap-2 text-base font-extrabold"><LockSimpleIcon size={16} className="text-[var(--admin-muted)]" aria-hidden />{title}</h2><p className="text-sm text-[var(--admin-muted)]">{description}</p></header>
      <ol className="flex flex-wrap gap-2">{items.map((item, index) => <li key={item} className="adminTile inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold"><span className="text-[11px] font-bold text-[var(--admin-muted)]">{index + 1}</span>{item}</li>)}</ol>
    </section>
  );
}

export function InfoTile({ label, value, hint, badge = "Configured by system", children }: { label: string; value?: ReactNode; hint?: string; badge?: string; children?: ReactNode }) {
  return (
    <div className="adminSurface flex flex-col gap-2 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-[var(--admin-muted)]">{label}</p><span className="whitespace-nowrap rounded-full bg-[var(--admin-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-muted)]">{badge}</span></div>
      {value !== undefined ? <p className="text-2xl font-extrabold tracking-tight">{value}</p> : null}
      {children}
      {hint ? <p className="text-xs text-[var(--admin-muted)]">{hint}</p> : null}
    </div>
  );
}
