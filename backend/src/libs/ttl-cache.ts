export function cachedFor<T>(seconds: number, load: () => Promise<T>) {
  let entry: { value: T; expires: number } | undefined;
  let inflight: Promise<T> | undefined;

  const read = async (): Promise<T> => {
    if (seconds <= 0) return load();
    if (entry && entry.expires > Date.now()) return entry.value;
    inflight ??= load()
      .then((value) => {
        entry = { value, expires: Date.now() + seconds * 1000 };
        return value;
      })
      .finally(() => {
        inflight = undefined;
      });
    return inflight;
  };

  read.clear = () => {
    entry = undefined;
  };
  return read;
}
