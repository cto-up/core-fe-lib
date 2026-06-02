/**
 * Helper functions for building auth subdomain URLs
 */

function getBaseDomainInfo() {
  const url = new URL(globalThis.location.href);
  const hostParts = url.hostname.split(".");

  const baseDomain =
    hostParts.length > 2 ? hostParts.slice(-2).join(".") : url.hostname;
  const authOrigin = `${url.protocol}//auth.${baseDomain}${url.port ? `:${url.port}` : ""}`;
  const pathPrefix = url.pathname.startsWith("/admin") ? "/admin" : "";

  return { authOrigin, pathPrefix };
}

/**
 * Get the auth subdomain URL for the current environment
 */
export function getAuthOrigin(): string {
  const { authOrigin, pathPrefix } = getBaseDomainInfo();

  if (pathPrefix) {
    console.warn("Beware using pathPrefix", pathPrefix);
    return `${authOrigin}${pathPrefix}`;
  }

  return authOrigin;
}

export function hasPathPrefix(): boolean {
  return !!getBaseDomainInfo().pathPrefix;
}

/**
 * Build a WebAuthn verification URL with return_to parameter.
 * Pass mode="popup" when the ceremony runs in a popup window that reports
 * its result back to the opener via postMessage instead of navigating return_to.
 */
export function buildWebAuthnVerifyUrl(
  returnTo?: string,
  mode?: "redirect" | "popup"
): string {
  const authOrigin = getAuthOrigin();
  const returnUrl = returnTo || globalThis.location.href;
  const url = `${authOrigin}/verify/webauthn?return_to=${encodeURIComponent(returnUrl)}`;
  return mode === "popup" ? `${url}&mode=popup` : url;
}

/**
 * Build a WebAuthn registration URL with return_to parameter
 */
export function buildWebAuthnRegisterUrl(returnTo?: string): string {
  const authOrigin = getAuthOrigin();
  const returnUrl = returnTo || globalThis.location.href;
  return `${authOrigin}/register/webauthn?return_to=${encodeURIComponent(returnUrl)}`;
}
