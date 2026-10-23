import type { Locale } from "./config";
import auth from "./messages/auth";
import bike from "./messages/bike";
import bikes from "./messages/bikes";
import booking from "./messages/booking";
import browse from "./messages/browse";
import common from "./messages/common";
import help from "./messages/help";
import home from "./messages/home";
import legal from "./messages/legal";
import loans from "./messages/loans";
import nav from "./messages/nav";
import places from "./messages/places";
import profile from "./messages/profile";

const modules = { common, nav, auth, home, browse, bike, bikes, booking, profile, loans, help, legal, places };

export type Messages = { [K in keyof typeof modules]: (typeof modules)[K]["en"] };

const build = (locale: Locale) => Object.fromEntries(Object.entries(modules).map(([name, pack]) => [name, pack[locale]])) as Messages;

export const messages: Record<Locale, Messages> = { en: build("en"), km: build("km"), zh: build("zh"), ko: build("ko") };

export { defaultLocale, detectLocale, isLocale, localeMeta, locales, type Locale } from "./config";
export { localeStore } from "./store";
