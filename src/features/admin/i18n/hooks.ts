"use client";

import { useCallback } from "react";
import { adminMessages } from "./messages";
import { useAdminLocale } from "./provider";

type MessageValues = Record<string, string | number>;

function resolveMessage(locale: keyof typeof adminMessages, key: string) {
  let current: unknown = adminMessages[locale];
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object" || !(segment in current)) return key;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : key;
}

export function useAdminTranslations() {
  const { locale } = useAdminLocale();
  return useCallback((key: string, values?: MessageValues) => {
    const message = resolveMessage(locale, key);
    if (!values) return message;
    return message.replace(/\{(\w+)\}/g, (match, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : match);
  }, [locale]);
}
