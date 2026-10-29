export type ApiMeta = Record<string, unknown> & {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type ApiEnvelope<T, M extends ApiMeta = ApiMeta> = {
  success?: boolean;
  data: T;
  meta?: M;
};

export type ApiDataEnvelope<T> = ApiEnvelope<T>;

export type ApiPage<T> = { data: T[]; meta: ApiMeta };

export const unwrapData = <T>(envelope: ApiEnvelope<T>) => envelope.data;

export const unwrapPage = <T>(envelope: ApiEnvelope<T[]>): ApiPage<T> => ({
  data: envelope.data,
  meta: envelope.meta ?? {},
});
