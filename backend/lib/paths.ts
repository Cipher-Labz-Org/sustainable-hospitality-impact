export function safeNextPath(value: string | null | undefined, fallback = "/assessment") {
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
