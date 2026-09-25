/**
 * Where a user may be sent after an auth step, taken from a query parameter
 * (`from`, `return_to`) that anyone can put in a link.
 *
 * Allowed: an app path (`/x`, never `//x` or `/\x`, which browsers read as
 * another host), or an absolute http(s) URL on the current base domain — the
 * auth subdomain hands users back to a tenant subdomain, and the OAuth session
 * gate sends an absolute backend URL — or on the configured API origin.
 * Anything else falls back, so a crafted link cannot land a freshly signed-in
 * user on someone else's site.
 */
export function safeRedirectTarget(
  target: string | null | undefined,
  fallback = "/",
  currentUrl: string = globalThis.location.href,
  extraOrigins: string[] = apiOrigins()
): string {
  if (!target) return fallback;
  if (target.startsWith("/")) {
    return target.startsWith("//") || target.startsWith("/\\")
      ? fallback
      : target;
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return fallback;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;

  const here = new URL(currentUrl);
  const base = baseDomain(here.hostname);
  if (url.hostname === base || url.hostname.endsWith(`.${base}`)) {
    return url.toString();
  }
  return extraOrigins.includes(url.origin) ? url.toString() : fallback;
}

function baseDomain(hostname: string): string {
  const parts = hostname.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
}

function apiOrigins(): string[] {
  const api = import.meta.env?.VITE_HTTP_API as string | undefined;
  if (!api) return [];
  try {
    return [new URL(api).origin];
  } catch {
    return [];
  }
}
