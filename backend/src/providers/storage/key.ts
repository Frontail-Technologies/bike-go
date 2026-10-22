const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]*$/i;

export function assertSafeKey(key: string) {
  if (!SAFE_KEY.test(key) || key.includes("..") || key.includes("//")) throw new Error(`Refusing unsafe storage key: ${key}`);
  return key;
}
