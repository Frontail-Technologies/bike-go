"use client";

import { I18nProvider as AriaI18nProvider } from "@heroui/react";
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_LOCALE_COOKIE, type AdminLocale, adminLocaleMeta } from "./config";

type AdminLocaleContextValue = { locale: AdminLocale; setLocale: (locale: AdminLocale) => void };
const defaultContext: AdminLocaleContextValue = { locale: "en", setLocale: () => undefined };
const AdminLocaleContext = createContext<AdminLocaleContextValue>(defaultContext);

export function AdminI18nProvider({ initialLocale, children }: { initialLocale: AdminLocale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((next: AdminLocale) => {
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; Path=/admin; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    startTransition(() => setLocaleState(next));
  }, []);

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = adminLocaleMeta[locale].lang;
    return () => { document.documentElement.lang = previous; };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return (
    <AdminLocaleContext value={value}>
      <AriaI18nProvider locale={adminLocaleMeta[locale].lang}>{children}</AriaI18nProvider>
    </AdminLocaleContext>
  );
}

export function useAdminLocale() {
  return useContext(AdminLocaleContext);
}
