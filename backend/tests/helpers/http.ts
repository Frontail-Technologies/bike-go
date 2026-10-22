export async function json<T = any>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
