import { env } from "@/env";
import { LocalStorageProvider } from "./local";
import { R2StorageProvider } from "./r2";
import type { StorageProvider } from "./types";

function createStorage(): StorageProvider {
  if (env.STORAGE_DRIVER === "r2") {
    return new R2StorageProvider({
      endpoint: env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      bucket: env.R2_BUCKET!,
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    });
  }
  return new LocalStorageProvider(env.STORAGE_ROOT);
}

export const storage = createStorage();
