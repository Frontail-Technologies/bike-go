import { S3Client } from "bun";
import { assertSafeKey } from "./key";
import type { R2Config, StorageProvider } from "./types";

const isNotFound = (error: unknown) => {
  const code = (error as { code?: string }).code;
  return code === "NoSuchKey" || code === "NotFound" || code === "ENOENT";
};

export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(config: R2Config) {
    this.client = new S3Client({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      bucket: config.bucket,
      endpoint: config.endpoint,
      region: "auto",
    });
  }

  async put(key: string, data: Uint8Array, options: { contentType: string }) {
    await this.client.file(assertSafeKey(key)).write(data, { type: options.contentType });
  }

  async get(key: string) {
    try {
      return new Uint8Array(await this.client.file(assertSafeKey(key)).arrayBuffer());
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(key: string) {
    await this.client.delete(assertSafeKey(key));
  }

  async createUploadTarget() {
    return null;
  }

  async getDownloadUrl(key: string, options: { expiresInSeconds: number }) {
    return this.client.presign(assertSafeKey(key), { method: "GET", expiresIn: options.expiresInSeconds });
  }
}
