export const ADMIN_LOCALE_COOKIE = "ridego_admin_locale";
export const adminLocales = ["en", "km"] as const;
export type AdminLocale = (typeof adminLocales)[number];
export const defaultAdminLocale: AdminLocale = "en";

export const adminLocaleMeta: Record<AdminLocale, { label: string; short: string; lang: AdminLocale }> = {
  en: { label: "English", short: "EN", lang: "en" },
  km: { label: "ខ្មែរ", short: "ខ្មែរ", lang: "km" },
};

export const isAdminLocale = (value: unknown): value is AdminLocale =>
  typeof value === "string" && (adminLocales as readonly string[]).includes(value);
