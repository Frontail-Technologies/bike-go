"use client";

import { BankIcon, BriefcaseIcon, CheckCircleIcon, GlobeIcon, HouseLineIcon, IdentificationCardIcon, ReceiptIcon, XIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";
import { compressImage } from "@/lib/image-compression";
import { ACCEPTED_FILES, type DocumentId, MAX_FILE_BYTES, type StoredFile } from "../lib/data";

const icons: Record<DocumentId, typeof BankIcon> = {
  passport: IdentificationCardIcon,
  residence: GlobeIcon,
  employment: BriefcaseIcon,
  income: ReceiptIcon,
  address: HouseLineIcon,
  bank: BankIcon,
};

const formatSize = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);

type DocumentUploadProps = {
  label: string;
  hint: string;
  file: StoredFile | undefined;
  onChange: (file: StoredFile | undefined) => void;
  doc?: DocumentId;
  requested?: boolean;
};

export function DocumentUpload({ label, hint, file, onChange, doc, requested }: DocumentUploadProps) {
  const inputId = useId();
  const t = useTranslations("loans");
  const [error, setError] = useState<string | null>(null);
  const Icon = doc ? icons[doc] : IdentificationCardIcon;
  const selected = file?.raw instanceof File ? file : undefined;

  async function pick(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(picked.name)) {
      setError(t("upErrType"));
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setError(t("upErrSize"));
      return;
    }
    setError(null);
    const file = await compressImage(picked);
    onChange({ name: file.name, size: file.size, raw: file });
  }

  return (
    <div className={cn("flex flex-col gap-2 rounded-card border bg-surface p-3", requested && !file ? "border-brand" : "border-line")}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-surface-secondary">
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 font-semibold">{label}</p>
          {selected ? (
            <p className="flex items-center gap-1.5 truncate text-xs text-subtle">
              <CheckCircleIcon aria-label={t("upAdded")} size={14} weight="fill" className="shrink-0 text-[#15803d]" />
              <span className="truncate" data-testid="file-name">
                {selected.name}
              </span>
              <span className="tabular shrink-0">· {formatSize(selected.size)}</span>
            </p>
          ) : (
            <p className="text-xs leading-4 text-subtle">{hint}</p>
          )}
        </div>
        {selected ? (
          <button
            type="button"
            aria-label={t("upRemove", { label })}
            onClick={() => onChange(undefined)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ink"
          >
            <XIcon size={18} />
          </button>
        ) : (
          <label
            htmlFor={inputId}
            className="flex min-h-11 shrink-0 cursor-pointer items-center rounded-control border border-brand bg-brand-soft px-4 text-sm font-semibold outline-none focus-within:ring-2 focus-within:ring-ink hover:bg-brand/30"
          >
            {t("upUpload")}
            <input id={inputId} type="file" accept={ACCEPTED_FILES} className="sr-only" aria-label={t("upUploadAria", { label })} onChange={(e) => pick(e.target.files)} />
          </label>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
