import { env } from "@/env";
import { LocalStorageProvider } from "./local";
import type { StorageProvider } from "./types";

export const storage: StorageProvider = new LocalStorageProvider(env.STORAGE_ROOT);
