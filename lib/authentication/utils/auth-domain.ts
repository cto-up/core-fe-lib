/**
 * Helper functions for building auth subdomain URLs
 */

/**
 * Get the auth subdomain URL for the current environment
 * Extracts the base domain and builds auth.{baseDomain}
 */
export function getAuthOrigin(): string {
  const url = new URL(globalThis.location.href);
  const hostParts = url.hostname.split(".");

  // Extract base domain (e.g., ctoup.localhost from corpb.ctoup.localhost)
  let baseDomain = url.hostname;

  // If we have subdomains (more than 2 parts), extract the base domain
  // Examples:
  // - corpb.ctoup.localhost -> ctoup.localhost
  // - auth.ctoup.localhost -> ctoup.localhost
  // - ctoup.localhost -> ctoup.localhost (no change)
  if (hostParts.length > 2) {
    baseDomain = hostParts.slice(-2).join(".");
  }

  // Build auth origin with port if present
  const authOrigin = `${url.protocol}//auth.${baseDomain}${url.port ? `:${url.port}` : ""}`;

  return authOrigin;
}

/**
 * Build a WebAuthn verification URL with return_to parameter
 */
export function buildWebAuthnVerifyUrl(returnTo?: string): string {
  const authOrigin = getAuthOrigin();
  const returnUrl = returnTo || globalThis.location.href;
  return `${authOrigin}/verify/webauthn?return_to=${encodeURIComponent(returnUrl)}`;
}
