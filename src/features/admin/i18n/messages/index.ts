import type { AdminLocale } from "../config";
import bookings from "./bookings";
import core from "./core";
import customers from "./customers";
import ui from "./ui";
import vehicles from "./vehicles";

const modules = [core, ui, vehicles, bookings, customers];

export const adminMessages = Object.fromEntries(
  (["en", "km"] as const).map((locale) => [locale, Object.assign({}, ...modules.map((pack) => pack[locale]))]),
) as Record<AdminLocale, Record<string, unknown>>;
