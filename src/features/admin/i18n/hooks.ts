"use client";

import { useCallback } from "react";
import { useAdminLocale } from "./provider";
import { type AdminTranslate, translateAdmin } from "./translate";

export function useAdminTranslations(): AdminTranslate {
  const { locale } = useAdminLocale();
  return useCallback((key, values) => translateAdmin(locale, key, values), [locale]);
}
