export function safeCustomerReturnTo(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/admin")) return fallback;
  try {
    const url = new URL(value, "https://ridego.local");
    return url.origin === "https://ridego.local" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
