import type { Locale } from "./config";

export type Tree = { [key: string]: string | Tree };

export type Pack<T extends Tree> = Record<Locale, T>;

export const pack = <T extends Tree>(en: T, others: Record<Exclude<Locale, "en">, NoInfer<T>>): Pack<T> => ({ en, ...others });
