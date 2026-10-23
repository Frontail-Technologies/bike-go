"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import { type Locale, defaultLocale } from "./config";

export const LOCALE_KEY = "rgo.locale.v1";

export const localeStore = createPersistedStore<Locale>(LOCALE_KEY, defaultLocale);

let active: Locale = defaultLocale;

export const activeLocale = () => active;

export const setActiveLocale = (locale: Locale) => {
  active = locale;
};
