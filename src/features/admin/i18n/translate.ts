import { type AdminLocale, defaultAdminLocale } from "./config";
import { adminMessages } from "./messages";

export type AdminMessageValues = Record<string, string | number>;
export type AdminTranslate = (key: string, values?: AdminMessageValues) => string;

let active: AdminLocale = defaultAdminLocale;

export const activeAdminLocale = () => active;

export const setActiveAdminLocale = (locale: AdminLocale) => {
  active = locale;
};

function resolveMessage(locale: AdminLocale, key: string): string {
  let current: unknown = adminMessages[locale];
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object" || !(segment in current)) return locale === defaultAdminLocale ? key : resolveMessage(defaultAdminLocale, key);
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : key;
}

export function translateAdmin(locale: AdminLocale, key: string, values?: AdminMessageValues) {
  const message = resolveMessage(locale, key);
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match);
}

export const adminT: AdminTranslate = (key, values) => translateAdmin(active, key, values);

export const adminError = (key: string, values?: AdminMessageValues) => ({ error: () => adminT(key, values) });

export function adminLabels<K extends string>(prefix: string, keys: readonly K[]): Record<K, string> {
  const labels = {} as Record<K, string>;
  for (const key of keys) Object.defineProperty(labels, key, { enumerable: true, get: () => adminT(`${prefix}.${key}`) });
  return labels;
}
