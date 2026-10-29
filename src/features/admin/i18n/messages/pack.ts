import type { AdminLocale } from "../config";

export type AdminTree = { [key: string]: string | AdminTree };

export const adminPack = <T extends AdminTree>(en: T, km: NoInfer<T>): Record<AdminLocale, T> => ({ en, km });
