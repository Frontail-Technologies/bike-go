"use client";

import { Alert, Button } from "@heroui/react";
import { ArrowLeftIcon, ArrowRightIcon, ImageIcon, PlusIcon, StarIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { compressImage } from "@/lib/image-compression";

type LocalImage = { id: string; file: File; url: string };

export function ImageUploader({ limit = 5, maxSizeMb = 5, aspectClass = "aspect-[16/10]", emptyTitle = "Click to upload images", emptyHint, onChange, onPrimaryChange, onReorder }: { limit?: number; maxSizeMb?: number; aspectClass?: string; emptyTitle?: string; emptyHint?: string; onChange?: (files: File[]) => void; onPrimaryChange?: (file: File | null) => void; onReorder?: (files: File[]) => void }) {
  const inputId = useId();
  const [images, setImages] = useState<LocalImage[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const full = images.length >= limit;
  const openPicker = () => document.getElementById(inputId)?.click();
  const selected = images.find((item) => item.id === selectedId) ?? images.find((item) => item.id === primaryId) ?? images[0];

  function commit(next: LocalImage[]) { setImages(next); onChange?.(next.map((item) => item.file)); }
  async function add(files: FileList | File[] | null) {
    if (!files) return;
    const list = Array.from(files);
    const valid = list.filter((file) => file.type.startsWith("image/") && file.size <= maxSizeMb * 1024 * 1024).slice(0, Math.max(0, limit - images.length));
    setError(valid.length !== list.length ? `Use image files up to ${maxSizeMb} MB. Maximum ${limit} images.` : "");
    const compressed = await Promise.all(valid.map((file) => compressImage(file)));
    const added = compressed.map((file) => { const url = URL.createObjectURL(file); urls.current.push(url); return { id: crypto.randomUUID(), file, url }; });
    const next = [...images, ...added];
    commit(next);
    if (!primaryId && next[0]) { setPrimaryId(next[0].id); onPrimaryChange?.(next[0].file); }
    if (added[0]) setSelectedId(added[0].id);
  }
  function remove(item: LocalImage) {
    URL.revokeObjectURL(item.url);
    urls.current = urls.current.filter((url) => url !== item.url);
    const next = images.filter((image) => image.id !== item.id);
    commit(next);
    if (selectedId === item.id) setSelectedId(null);
    if (primaryId === item.id) { setPrimaryId(next[0]?.id ?? null); onPrimaryChange?.(next[0]?.file ?? null); }
  }
  function makePrimary(item: LocalImage) { setPrimaryId(item.id); onPrimaryChange?.(item.file); }
  function move(item: LocalImage, direction: -1 | 1) {
    const index = images.findIndex((image) => image.id === item.id);
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    onReorder?.(next.map((image) => image.file));
  }

  const dropProps = {
    onDragOver: (event: React.DragEvent) => { event.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (event: React.DragEvent) => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files); },
  };

  return <div className="space-y-3">
    <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple tabIndex={-1} onChange={(event) => { add(event.target.files); event.currentTarget.value = ""; }} />
    {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Some images were not added</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}

    {selected ? (
      <div className="space-y-3">
        <div {...dropProps} className={cn("relative overflow-hidden rounded-2xl border bg-[var(--admin-surface-muted)] transition-colors", aspectClass, dragging ? "border-[var(--admin-accent-strong)] ring-2 ring-[var(--admin-accent)]" : "border-[var(--admin-border)]")}>
          <Image src={selected.url} alt={selected.file.name} fill unoptimized className="object-cover" />
          {primaryId === selected.id ? <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--admin-accent)] px-2.5 py-1 text-[11px] font-extrabold text-[#111820] shadow-sm"><StarIcon size={12} weight="fill" aria-hidden />Primary</span> : null}
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 rounded-xl bg-white/90 p-1 backdrop-blur">
            <Button size="sm" variant="ghost" className="min-h-11" isDisabled={primaryId === selected.id} onPress={() => makePrimary(selected)}><StarIcon size={16} weight={primaryId === selected.id ? "fill" : "regular"} />Make primary</Button>
            <div className="flex">
              <Button isIconOnly size="sm" variant="ghost" className="size-11 min-w-11" aria-label={`Move ${selected.file.name} earlier`} isDisabled={images[0]?.id === selected.id} onPress={() => move(selected, -1)}><ArrowLeftIcon size={16} /></Button>
              <Button isIconOnly size="sm" variant="ghost" className="size-11 min-w-11" aria-label={`Move ${selected.file.name} later`} isDisabled={images.at(-1)?.id === selected.id} onPress={() => move(selected, 1)}><ArrowRightIcon size={16} /></Button>
              <Button isIconOnly size="sm" variant="ghost" className="size-11 min-w-11 text-[var(--admin-danger)]" aria-label={`Remove ${selected.file.name}`} onPress={() => remove(selected)}><TrashIcon size={16} /></Button>
            </div>
          </div>
        </div>
        {limit > 1 ? <ul className="grid grid-cols-4 gap-2" aria-label="Selected images">
          {images.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setSelectedId(item.id)} aria-label={`Preview ${item.file.name}`} aria-current={item.id === selected.id} className={cn("relative block aspect-[4/3] w-full overflow-hidden rounded-xl border-2 outline-none transition-[border-color,opacity] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]", item.id === selected.id ? "border-[var(--admin-accent)]" : "border-transparent opacity-75 hover:opacity-100")}>
                <Image src={item.url} alt="" fill unoptimized className="object-cover" />
                {primaryId === item.id ? <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)]" aria-hidden><StarIcon size={11} weight="fill" /></span> : null}
              </button>
            </li>
          ))}
          {!full ? <li><button type="button" onClick={openPicker} aria-label="Add more images" className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border-2 border-dashed border-[var(--admin-border-strong)] text-[var(--admin-muted)] outline-none transition-colors hover:border-[var(--admin-accent-strong)] hover:text-[var(--admin-text)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]"><PlusIcon size={20} /></button></li> : null}
        </ul> : null}
      </div>
    ) : (
      <button type="button" onClick={openPicker} {...dropProps} className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]", dragging ? "border-[var(--admin-accent-strong)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] hover:border-[var(--admin-accent-strong)]")}>
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-[var(--admin-warning)] shadow-sm"><ImageIcon size={24} weight="duotone" /></span>
        <span className="text-sm font-bold">{emptyTitle}</span>
        <span className="text-xs text-[var(--admin-muted)]">{emptyHint ?? `or drag and drop · JPG, PNG or WebP · up to ${maxSizeMb} MB each`}</span>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-white px-3 py-1.5 text-xs font-bold"><UploadSimpleIcon size={14} />Choose files</span>
      </button>
    )}
    <p className="text-right text-[11px] text-[var(--admin-muted)]">{images.length}/{limit} images</p>
  </div>;
}
