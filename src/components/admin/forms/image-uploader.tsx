"use client";

import { Alert, Button } from "@heroui/react";
import { ArrowLeftIcon, ArrowRightIcon, ImageIcon, StarIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

type LocalImage = { id: string; file: File; url: string };
export function ImageUploader({ limit = 5, maxSizeMb = 5, onChange, onPrimaryChange, onReorder }: { limit?: number; maxSizeMb?: number; onChange?: (files: File[]) => void; onPrimaryChange?: (file: File | null) => void; onReorder?: (files: File[]) => void }) {
  const inputId = useId();
  const [images, setImages] = useState<LocalImage[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  function commit(next: LocalImage[]) { setImages(next); onChange?.(next.map((item) => item.file)); }
  function add(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= maxSizeMb * 1024 * 1024).slice(0, Math.max(0, limit - images.length));
    if (valid.length !== files.length) setError(`Use image files up to ${maxSizeMb} MB. Maximum ${limit} images.`); else setError("");
    const added = valid.map((file) => { const url = URL.createObjectURL(file); urls.current.push(url); return { id: crypto.randomUUID(), file, url }; });
    const next = [...images, ...added]; commit(next);
    if (!primaryId && next[0]) { setPrimaryId(next[0].id); onPrimaryChange?.(next[0].file); }
  }
  function remove(item: LocalImage) { URL.revokeObjectURL(item.url); urls.current = urls.current.filter((url) => url !== item.url); const next = images.filter((image) => image.id !== item.id); commit(next); if (primaryId === item.id) { setPrimaryId(next[0]?.id ?? null); onPrimaryChange?.(next[0]?.file ?? null); } }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= images.length) return; const next = [...images]; [next[index], next[target]] = [next[target], next[index]]; setImages(next); onReorder?.(next.map((item) => item.file)); }
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Vehicle images</p><p className="text-xs text-[var(--admin-muted)]">JPG, PNG or WebP · up to {maxSizeMb} MB each</p></div><Button variant="outline" isDisabled={images.length >= limit} onPress={() => document.getElementById(inputId)?.click()}><UploadSimpleIcon size={17} />Add images</Button><input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { add(event.target.files); event.currentTarget.value = ""; }} /></div>
    {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Some images were not added</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
    {images.length ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{images.map((item, index) => <li key={item.id} className={`overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white ${index === 0 ? "sm:col-span-2" : ""}`}><div className={`relative ${index === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}><Image src={item.url} alt={item.file.name} fill unoptimized className="object-cover" />{primaryId === item.id ? <span className="absolute left-2 top-2 rounded-full bg-[var(--admin-accent)] px-2 py-1 text-[10px] font-extrabold">Primary</span> : null}</div><div className="flex items-center justify-between gap-1 p-1"><Button isIconOnly size="sm" variant="ghost" aria-label={`Make ${item.file.name} primary`} onPress={() => { setPrimaryId(item.id); onPrimaryChange?.(item.file); }}><StarIcon size={15} weight={primaryId === item.id ? "fill" : "regular"} /></Button><div className="flex"><Button isIconOnly size="sm" variant="ghost" aria-label={`Move ${item.file.name} left`} isDisabled={index === 0} onPress={() => move(index, -1)}><ArrowLeftIcon size={14} /></Button><Button isIconOnly size="sm" variant="ghost" aria-label={`Move ${item.file.name} right`} isDisabled={index === images.length - 1} onPress={() => move(index, 1)}><ArrowRightIcon size={14} /></Button><Button isIconOnly size="sm" variant="ghost" aria-label={`Remove ${item.file.name}`} onPress={() => remove(item)}><TrashIcon size={15} /></Button></div></div></li>)}</ul> : <Button variant="ghost" onPress={() => document.getElementById(inputId)?.click()} className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-sm text-[var(--admin-muted)]"><ImageIcon size={27} className="mb-2" />Choose local images</Button>}
    <p className="text-right text-[11px] text-[var(--admin-muted)]">{images.length}/{limit} images</p>
  </div>;
}
