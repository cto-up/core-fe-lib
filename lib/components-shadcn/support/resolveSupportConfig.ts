/**
 * Derives the support desk from the deployment's own domain, so a single
 * implementation serves every app and every domain an app is deployed to.
 *
 * One app can serve several domains (hub ships to ctoup, taskfactory-eu and
 * taskfactory-cloud), so a hardcoded address would be wrong on all but one of
 * them. The domain is therefore resolved, in order:
 *
 *   1. an explicit `domain` override,
 *   2. `VITE_APP_BASE_URL` — set by CI to `https://${DOMAIN}` in every app,
 *      which makes it authoritative *and* immune to the URL the browser
 *      happens to be on (a Cloudflare preview build still carries the real
 *      production domain),
 *   3. the runtime host, guarded,
 *   4. nothing — and a config with no mailbox renders no support entry at all.
 *
 * Step 3 is guarded because deriving an address from a host you do not own
 * mails a stranger the screenshot, console log, user email and tenant id that
 * a report carries. `*.pages.dev` is the live example: it is where the
 * frontend is hosted, and `support@pages.dev` is Cloudflare's mailbox.
 */
import { useUrl } from "../../composables/useUrl";
import type { SupportConfig, SupportConfigInput } from "./types";

/** Shared hosting domains: never the deployment's own, always someone else's
 *  mailbox. A preview or staging build must not resolve to these. */
const HOSTING_DOMAINS = new Set([
  "pages.dev",
  "workers.dev",
  "vercel.app",
  "netlify.app",
  "netlify.com",
  "github.io",
  "gitlab.io",
  "herokuapp.com",
  "ngrok.io",
  "ngrok-free.app",
  "onrender.com",
  "fly.dev",
  "web.app",
  "firebaseapp.com",
]);

/** TLDs that never carry real mail. */
const NON_ROUTABLE_TLDS = new Set([
  "localhost",
  "local",
  "test",
  "invalid",
  "example",
]);

function isDev(): boolean {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

/**
 * True when an address at this domain could plausibly reach the team that
 * operates the deployment. Skipped in dev, where the derived
 * `support@<something>.localhost` is obviously fake, harmless, and lets the
 * whole flow be exercised locally.
 */
function isUsableDomain(domain: string): boolean {
  if (!domain || !domain.includes(".")) return false; // "localhost", single label
  if (/^\d/.test(domain)) return false; // IPv4/IPv6 literal
  if (HOSTING_DOMAINS.has(domain)) return false;
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  return !NON_ROUTABLE_TLDS.has(tld);
}

/** `getDomain` infers its parameter from a `= null` default; widen it once. */
const getDomain = useUrl().getDomain as (hostname?: string | null) => string;

function domainFromBaseUrl(): string | undefined {
  let raw: string | undefined;
  try {
    raw = import.meta.env?.VITE_APP_BASE_URL as string | undefined;
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  try {
    // Tolerate a bare host as well as a full origin.
    const host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
    return getDomain(host) || undefined;
  } catch {
    return undefined;
  }
}

function domainFromRuntimeHost(): string | undefined {
  const derived = getDomain() || undefined;
  if (!derived) return undefined;
  if (!isDev() && !isUsableDomain(derived)) return undefined;
  return derived;
}

/** `sparkmeee.com` → `Sparkmeee`. Only the subject tag reads this, so a brand
 *  with inner capitals passes `appName` explicitly. */
function appNameFromDomain(domain: string): string {
  const label = domain.split(".")[0] ?? domain;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Resolves the mailboxes for the "Help & contact" dialog.
 *
 * Returns `undefined` when no domain can be trusted — the caller then renders
 * no support entry, which is the safe outcome: silence beats mailing a
 * stranger.
 */
export function resolveSupportConfig(
  input: SupportConfigInput = true
): SupportConfig | undefined {
  if (input === false) return undefined;
  const overrides: Partial<SupportConfig> = input === true ? {} : input;

  // A fully-specified config needs no derivation at all.
  if (overrides.contactEmail && overrides.supportEmail) {
    return overrides as SupportConfig;
  }

  const domain =
    overrides.domain ?? domainFromBaseUrl() ?? domainFromRuntimeHost();

  if (!domain) {
    // Nothing trustworthy to derive from: honour an explicit contact address
    // if one was given, otherwise render nothing.
    return overrides.contactEmail ? (overrides as SupportConfig) : undefined;
  }

  return {
    contactEmail: overrides.contactEmail ?? `contact@${domain}`,
    supportEmail: overrides.supportEmail ?? `support@${domain}`,
    appName: overrides.appName ?? appNameFromDomain(domain),
  };
}
