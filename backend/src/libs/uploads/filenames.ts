export function sanitizeFilename(name: string, fallback = "document") {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/\p{Cc}/gu, "")
    .replace(/[^\w.\- ()]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}
