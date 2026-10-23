"use client";

import { I18nProvider as AriaI18nProvider } from "@heroui/react";
import { startTransition, useEffect, useState } from "react";
import { IntlProvider } from "use-intl";
import { type Locale, defaultLocale, detectLocale, isLocale, localeMeta } from "./config";
import { DocumentTitle } from "./document-title";
import { messages } from "./index";
import { LOCALE_KEY, PENDING_ATTRIBUTE } from "./pending";
import { localeStore, setActiveLocale } from "./store";

function intendedLocale(): Locale {
  try {
    const raw = window.localStorage.getItem(LOCALE_KEY);
    if (raw !== null) {
      const stored: unknown = JSON.parse(raw);
      return isLocale(stored) ? stored : defaultLocale;
    }
    return detectLocale(navigator.languages ?? [navigator.language]);
  } catch {
    return defaultLocale;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const saved = localeStore.useValue();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  setActiveLocale(locale);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(LOCALE_KEY) === null) {
        const detected = detectLocale(navigator.languages ?? [navigator.language]);
        if (detected !== saved) {
          localeStore.set(detected);
          return;
        }
      }
    } catch {
      return;
    }
    startTransition(() => setLocale(saved));
  }, [saved]);

  useEffect(() => {
    document.documentElement.lang = localeMeta[locale].lang;
    if (locale === intendedLocale()) document.documentElement.removeAttribute(PENDING_ATTRIBUTE);
  }, [locale]);

  return (
    <IntlProvider locale={locale} messages={messages[locale]} timeZone="Asia/Phnom_Penh" onError={() => undefined}>
      <AriaI18nProvider locale={localeMeta[locale].intl}>
        <DocumentTitle />
        {children}
      </AriaI18nProvider>
    </IntlProvider>
  );
}
