export const locales = ["en", "km", "zh", "ko"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; short: string; lang: string; intl: string }> = {
  en: { label: "English", short: "EN", lang: "en", intl: "en-IN" },
  km: { label: "ខ្មែរ", short: "ខ្មែរ", lang: "km", intl: "km-KH" },
  zh: { label: "中文", short: "中文", lang: "zh-CN", intl: "zh-CN" },
  ko: { label: "한국어", short: "한국어", lang: "ko", intl: "ko-KR" },
};

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && (locales as readonly string[]).includes(value);

export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
