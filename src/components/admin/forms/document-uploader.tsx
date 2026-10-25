"use client";

import { Alert, Button } from "@heroui/react";
import { FilePdfIcon, FileTextIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";

export function DocumentUploader({ accept = ["application/pdf", "image/jpeg", "image/png"], maxSizeMb = 8, onChange }: { accept?: string[]; maxSizeMb?: number; onChange?: (file: File | null) => void }) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  function choose(next: File | undefined) {
    if (!next) return;
    if (!accept.includes(next.type)) { setError("This file type is not supported."); return; }
    if (next.size > maxSizeMb * 1024 * 1024) { setError(`File must be ${maxSizeMb} MB or smaller.`); return; }
    setError(""); setFile(next); onChange?.(next);
  }
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Supporting document</p><p className="text-xs text-[var(--admin-muted)]">PDF, JPG or PNG · up to {maxSizeMb} MB</p></div><Button variant="outline" onPress={() => document.getElementById(inputId)?.click()}><UploadSimpleIcon size={17} />{file ? "Replace" : "Choose file"}</Button><input id={inputId} className="sr-only" type="file" accept={accept.join(",")} onChange={(event) => { choose(event.target.files?.[0]); event.currentTarget.value = ""; }} /></div>
    {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Document not accepted</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
    {file ? <div className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-white p-3">{file.type === "application/pdf" ? <FilePdfIcon size={28} className="text-[var(--admin-danger)]" /> : <FileTextIcon size={28} className="text-[#6246c7]" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{file.name}</p><p className="text-xs text-[var(--admin-muted)]">{file.type || "Unknown type"} · {(file.size / 1024).toFixed(1)} KB</p></div><Button isIconOnly variant="ghost" aria-label={`Remove ${file.name}`} onPress={() => { setFile(null); onChange?.(null); }}><TrashIcon size={17} /></Button></div> : <Button variant="ghost" onPress={() => document.getElementById(inputId)?.click()} className="flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-sm text-[var(--admin-muted)]"><FileTextIcon size={26} className="mb-2" />Choose a local document</Button>}
  </div>;
}
