/**
 * Helper functions for building auth subdomain URLs
 */

/**
 * Get the auth subdomain URL for the current environment
 */
export function getAuthOrigin(): string {
  const url = new URL(globalThis.location.href);
  const hostParts = url.hostname.split(".");

  let baseDomain = url.hostname;

  if (hostParts.length > 2) {
    baseDomain = hostParts.slice(-2).join(".");
  }

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

/**
 * Build a WebAuthn registration URL with return_to parameter
 */
export function buildWebAuthnRegisterUrl(returnTo?: string): string {
  const authOrigin = getAuthOrigin();
  const returnUrl = returnTo || globalThis.location.href;
  return `${authOrigin}/register/webauthn?return_to=${encodeURIComponent(returnUrl)}`;
}
