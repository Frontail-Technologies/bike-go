"use client";

import { I18nProvider as AriaI18nProvider } from "@heroui/react";
import { startTransition, useEffect, useState } from "react";
import { IntlProvider } from "use-intl";
import { type Locale, defaultLocale, detectLocale, localeMeta } from "./config";
import { DocumentTitle } from "./document-title";
import { messages } from "./index";
import { LOCALE_KEY, localeStore, setActiveLocale } from "./store";

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
