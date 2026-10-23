"use client";

import { localeMeta } from "./config";
import { activeLocale, localeStore } from "./store";

export { useFormatter, useTranslations } from "use-intl";

export const useAppLocale = () => localeStore.useValue();

export const setAppLocale = localeStore.set;

export const intlLocale = () => localeMeta[activeLocale()].intl;
