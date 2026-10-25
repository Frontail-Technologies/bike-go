export type ApiMeta = Record<string, unknown> & {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type ApiEnvelope<T> = { success: true; data: T; meta: ApiMeta };
export type ApiPage<T> = { data: T[]; meta: ApiMeta };

export const unwrapData = <T>(envelope: ApiEnvelope<T>): T => envelope.data;
export const unwrapPage = <T>(envelope: ApiEnvelope<T[]>): ApiPage<T> => ({ data: envelope.data, meta: envelope.meta });
