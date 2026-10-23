import { storage } from "@/providers/storage";
import type { InspectedUpload } from "./inspect";

export type StagedUpload = { key: string; upload: InspectedUpload };

export async function discardQuietly(keys: readonly string[]) {
  const results = await Promise.allSettled(keys.map((key) => storage.delete(key)));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) console.error(`storage cleanup: ${failed} of ${keys.length} objects could not be removed`);
}

export async function uploadAll(items: readonly StagedUpload[]) {
  const done: string[] = [];
  try {
    for (const { key, upload } of items) {
      await storage.put(key, upload.bytes, { contentType: upload.contentType });
      done.push(key);
    }
  } catch (error) {
    await discardQuietly(done);
    throw error;
  }
  return done;
}

export async function commitOrDiscard<T>(newKeys: readonly string[], mutate: () => Promise<T>) {
  try {
    return await mutate();
  } catch (error) {
    await discardQuietly(newKeys);
    throw error;
  }
}
