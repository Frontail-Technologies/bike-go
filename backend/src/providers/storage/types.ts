export interface StorageProvider {
  put(key: string, data: Uint8Array, options: { contentType: string }): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  createUploadTarget(key: string, options: { contentType: string; maxBytes: number }): Promise<{ url: string; method: "PUT"; headers: Record<string, string> } | null>;
  getDownloadUrl(key: string, options: { expiresInSeconds: number }): Promise<string | null>;
}
