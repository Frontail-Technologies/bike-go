import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { assertSafeKey } from "./key";
import type { StorageProvider } from "./types";

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private pathFor(key: string) {
    const full = resolve(this.root, assertSafeKey(key));
    if (!full.startsWith(this.root + sep)) throw new Error(`Refusing storage key outside the root: ${key}`);
    return full;
  }

  async put(key: string, data: Uint8Array, _options?: { contentType: string }) {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async get(key: string) {
    try {
      return new Uint8Array(await readFile(this.pathFor(key)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string) {
    await rm(this.pathFor(key), { force: true });
  }

  async createUploadTarget() {
    return null;
  }

  async getDownloadUrl() {
    return null;
  }
}
