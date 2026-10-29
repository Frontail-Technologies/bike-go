"use client";

import { Dropdown } from "@heroui/react";
import { CheckIcon, GlobeHemisphereEastIcon } from "@phosphor-icons/react";
import { adminLocaleMeta, adminLocales, type AdminLocale } from "../config";
import { useAdminTranslations } from "../hooks";
import { useAdminLocale } from "../provider";

export function AdminLanguageSwitcher({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  const t = useAdminTranslations();
  const { locale, setLocale } = useAdminLocale();
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`${t("language.label")}: ${adminLocaleMeta[locale].label}`}
        className={`flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-(--admin-accent-strong) ${inverse ? "text-white hover:bg-white/10" : "text-(--admin-muted) hover:bg-(--admin-surface-muted) hover:text-(--admin-text)"}`}
      >
        <GlobeHemisphereEastIcon size={18} aria-hidden />
        {compact ? null : <span>{adminLocaleMeta[locale].short}</span>}
      </Dropdown.Trigger>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={t("language.choose")} onAction={(key) => setLocale(key as AdminLocale)}>
          {adminLocales.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={adminLocaleMeta[code].label}>
              <span lang={adminLocaleMeta[code].lang} className="flex w-full items-center justify-between gap-5">
                <span>{code === "en" ? t("language.english") : t("language.khmer")}</span>
                {locale === code ? <CheckIcon size={16} weight="bold" aria-hidden /> : null}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
