import { useUrl } from "../composables/useUrl";

const DEFAULT_FAVICON = "/favicon.ico";

function applyFavicon(href: string) {
  document
    .querySelectorAll('link[rel*="icon"]')
    .forEach((link) => link.remove());

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/x-icon";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Dynamically sets the favicon based on the subdomain.
 *
 * Naming convention:
 * - Default: /favicon.ico
 * - Subdomain-specific: /favicon-{subdomain}.ico (used only when it really exists)
 *
 * The subdomain-specific file is probed with fetch and the response's
 * content-type is inspected before swapping. This is required because on an
 * SPA host (e.g. Cloudflare Pages) a missing /favicon-{subdomain}.ico is served
 * the index.html fallback with HTTP 200 — so `res.ok` alone, and the old
 * `link.onerror` handler, never detect the miss and the tab shows a blank icon.
 */
export async function setDynamicFavicon(subdomain?: string) {
  const { isAdminSubdomain } = useUrl();

  if (!subdomain || isAdminSubdomain(subdomain)) {
    applyFavicon(DEFAULT_FAVICON);
    return;
  }

  const candidate = `/favicon-${subdomain}.ico`;
  try {
    const res = await fetch(candidate, { method: "GET" });
    const contentType = res.headers.get("content-type") ?? "";
    if (res.ok && /image|icon/i.test(contentType)) {
      applyFavicon(candidate);
      return;
    }
  } catch {
    // network error — fall through to default
  }

  applyFavicon(DEFAULT_FAVICON);
}
