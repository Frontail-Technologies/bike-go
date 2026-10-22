/* eslint-disable @typescript-eslint/no-explicit-any */
/** Parsed JSON of a test response. Tests assert on shape, so `any` keeps them readable. */
export async function json<T = any>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
