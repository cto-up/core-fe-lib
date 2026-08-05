/**
 * Diagnostics for a failed "set your password" / password-recovery link.
 *
 * Why this exists: the page cannot learn WHY a link failed from the submission
 * itself. Kratos answers a browser recovery flow with a 303 whether it accepted
 * the token or rejected it, and the submission uses `redirect: "manual"`, which
 * makes every redirect an opaque status-0 response with unreadable headers. So
 * the cause has to be reconstructed afterwards, from what the page CAN still
 * observe: whether a session now exists, the flow's own timestamps, and whether
 * this browser is actually capable of storing the cookie.
 *
 * Contains no secrets. The recovery token is never recorded — only whether one
 * was present. The flow id is included deliberately: it is the join key to
 * Kratos's server-side logs, and it is not a credential.
 */

export type RecoveryFailureReason =
  | "expired"
  | "already_used_or_invalid"
  | "cookies_blocked"
  | "unknown";

export type RecoveryFailureStage = "activate" | "settings";

export interface RecoveryFailureFacts {
  /** Recovery flow id from the emailed link. Not a credential. */
  flowId?: string;
  /** Whether the link carried a token at all. The token itself is never kept. */
  hadToken: boolean;
  /** `expires_at` of the recovery flow, when it could still be read back. */
  flowExpiresAt?: string;
  /** `issued_at` of the recovery flow, when it could still be read back. */
  flowIssuedAt?: string;
  /**
   * expires_at − issued_at, in minutes. This is the server's ACTUAL configured
   * link lifespan, read back from a real flow. If this reads 60 when the config
   * says 24h, the Kratos container was never recreated and the deploy silently
   * did nothing — a failure mode that is otherwise invisible from the outside.
   */
  flowLifespanMinutes?: number;
  /** `navigator.cookieEnabled`. False is a true positive; true proves little. */
  cookiesEnabled: boolean;
  /**
   * Did a real first-party cookie survive a write-then-read? This is the
   * signal that matters: `cookieEnabled` reports the global preference and
   * still returns true under per-site blocking, ITP variations and some
   * in-app browsers. Undefined if the probe itself threw.
   */
  cookieWriteWorks?: boolean;
  /**
   * Same probe, but with `domain=<registrable domain>` — which is how Kratos
   * actually sets the session cookie (Domain=.example.com so it is shared
   * across tenant subdomains). A browser can allow a host-only cookie and
   * still reject a domain-scoped one, and that difference is exactly what
   * would break this flow while leaving the rest of the site working.
   */
  cookieDomainWriteWorks?: boolean;
  /** Count of script-visible cookies. Kratos's own are HttpOnly, so this is
   *  only a coarse "can this browser store anything at all" signal. */
  visibleCookieCount: number;
  /** localStorage usable? A proxy for private mode / storage partitioning. */
  storageWorks?: boolean;
  /** Matched in-app-browser token (a mail or social app's embedded WebView). */
  inAppBrowser?: string;
  /** Rendered inside an iframe — third-party cookie context. */
  isFramed?: boolean;
  /** Page origin, so a wrong tenant host is visible at a glance. */
  pageOrigin?: string;
  userAgent?: string;
  kratosErrorId?: string;
  kratosErrorCode?: number;
  /** Milliseconds since the flow was issued, when known. */
  linkAgeMs?: number;
  /** Reference point for the expiry comparison; injected so this is testable. */
  now: number;
}

export interface RecoveryFailureReport extends RecoveryFailureFacts {
  stage: RecoveryFailureStage;
  reason: RecoveryFailureReason;
}

/**
 * Embedded browsers shipped inside mail and social apps. They are worth naming
 * because several partition or drop cookies in ways the host browser does not,
 * and "he opened it from the Gmail app" is otherwise unknowable from a bug
 * report. Matching is best-effort: a miss costs nothing, it just leaves the
 * field empty.
 */
const IN_APP_BROWSER_RE =
  /\b(FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|LinkedInApp|Snapchat|WhatsApp|Outlook-iOS|OutlookMobile|Teams|Slack|GSA|Electron)\b/i;
/** Android System WebView marks itself with a bare `wv` token. */
const ANDROID_WEBVIEW_RE = /;\s*wv[);]/i;

export function detectInAppBrowser(userAgent: string): string | undefined {
  const named = IN_APP_BROWSER_RE.exec(userAgent);
  if (named) return named[1];
  if (ANDROID_WEBVIEW_RE.test(userAgent)) return "AndroidWebView";
  return undefined;
}

/**
 * Best-effort registrable domain: the last two labels of the hostname.
 *
 * Deliberately not a public-suffix implementation — it is wrong for
 * `example.co.uk` and friends. That is acceptable here because this only
 * decides the `domain=` attribute of a THROWAWAY probe cookie: a wrong guess
 * makes the probe fail to set, which reads as "domain cookies unavailable"
 * rather than corrupting anything. It mirrors the backend's own
 * extractBaseDomain heuristic.
 */
export function registrableDomain(hostname: string): string | undefined {
  if (!hostname || hostname === "localhost") return undefined;
  // An IP literal has no registrable domain.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return undefined;
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) return undefined;
  return parts.slice(-2).join(".");
}

const PROBE = "__rc_probe";

function probeCookie(domain?: string): boolean | undefined {
  try {
    const doc = globalThis.document;
    if (!doc) return undefined;
    const attrs = `path=/; SameSite=Lax${domain ? `; domain=.${domain}` : ""}`;
    doc.cookie = `${PROBE}=1; ${attrs}`;
    const ok = doc.cookie
      .split(";")
      .some((c) => c.trim().startsWith(`${PROBE}=`));
    // Always clean up, whether or not it took.
    doc.cookie = `${PROBE}=; Max-Age=0; ${attrs}`;
    return ok;
  } catch {
    return undefined;
  }
}

function probeStorage(): boolean | undefined {
  try {
    globalThis.localStorage.setItem(PROBE, "1");
    globalThis.localStorage.removeItem(PROBE);
    return true;
  } catch {
    return false;
  }
}

export type BrowserFacts = Pick<
  RecoveryFailureFacts,
  | "cookiesEnabled"
  | "cookieWriteWorks"
  | "cookieDomainWriteWorks"
  | "visibleCookieCount"
  | "storageWorks"
  | "inAppBrowser"
  | "isFramed"
  | "pageOrigin"
  | "userAgent"
  | "now"
>;

/** Collect the browser-side facts. Split out so the page stays declarative. */
export function collectBrowserFacts(): BrowserFacts {
  let cookiesEnabled = true;
  let visibleCookieCount = 0;
  let userAgent = "";
  let pageOrigin: string | undefined;
  let isFramed: boolean | undefined;

  try {
    cookiesEnabled = globalThis.navigator?.cookieEnabled ?? true;
    userAgent = globalThis.navigator?.userAgent ?? "";
    visibleCookieCount = globalThis.document?.cookie
      ? globalThis.document.cookie.split(";").filter((c) => c.trim()).length
      : 0;
    pageOrigin = globalThis.location?.origin;
  } catch {
    // Non-fatal: a locked-down browser can throw on any of these reads.
  }

  try {
    isFramed = globalThis.top !== globalThis.self;
  } catch {
    // Cross-origin parent — the throw itself proves we are framed.
    isFramed = true;
  }

  return {
    cookiesEnabled,
    cookieWriteWorks: probeCookie(),
    cookieDomainWriteWorks: probeCookie(
      registrableDomain(globalThis.location?.hostname ?? "")
    ),
    visibleCookieCount,
    storageWorks: probeStorage(),
    inAppBrowser: detectInAppBrowser(userAgent),
    isFramed,
    pageOrigin,
    userAgent,
    now: Date.now(),
  };
}

/**
 * Decide the most probable cause from what the page managed to observe.
 *
 * Order matters. A browser that cannot store the cookie redeems the token
 * perfectly well server-side and still ends up session-less, so it must be
 * ruled out BEFORE blaming the link — otherwise the user is sent to fetch a
 * replacement link that cannot possibly work either, forever.
 *
 * The functional probes outrank `cookiesEnabled`, which reports a global
 * preference and stays true under per-site blocking.
 */
export function classifyRecoveryFailure(
  facts: RecoveryFailureFacts
): RecoveryFailureReason {
  if (facts.cookieWriteWorks === false) return "cookies_blocked";
  if (facts.cookieDomainWriteWorks === false) return "cookies_blocked";
  if (!facts.cookiesEnabled) return "cookies_blocked";

  if (facts.flowExpiresAt) {
    const expiresAt = Date.parse(facts.flowExpiresAt);
    if (Number.isFinite(expiresAt)) {
      return expiresAt <= facts.now ? "expired" : "already_used_or_invalid";
    }
  }

  // The flow could not be read back (Kratos prunes it, or the id was never
  // valid). Expiry is unprovable, so don't claim it.
  return "unknown";
}

export interface DiagnosticRow {
  label: string;
  value: string;
}

const yesNo = (v: boolean | undefined, yes = "yes", no = "NO") =>
  v === undefined ? "unknown" : v ? yes : no;

/**
 * Flatten a report into labelled rows for display and clipboard.
 *
 * Kept here rather than in the component so the exact field set a user will
 * screenshot is covered by tests.
 */
export function buildDiagnosticRows(
  report: RecoveryFailureReport
): DiagnosticRow[] {
  const rows: DiagnosticRow[] = [
    { label: "reason", value: report.reason },
    { label: "stage", value: report.stage },
    { label: "flow", value: report.flowId || "—" },
    { label: "token", value: report.hadToken ? "present" : "absent" },
    { label: "cookies allowed", value: yesNo(report.cookiesEnabled) },
    { label: "cookie write", value: yesNo(report.cookieWriteWorks) },
    { label: "domain cookie", value: yesNo(report.cookieDomainWriteWorks) },
    { label: "cookies visible", value: String(report.visibleCookieCount) },
    { label: "storage", value: yesNo(report.storageWorks) },
  ];

  if (report.inAppBrowser) {
    rows.push({ label: "in-app browser", value: report.inAppBrowser });
  }
  if (report.isFramed) rows.push({ label: "framed", value: "yes" });
  if (report.pageOrigin) {
    rows.push({ label: "origin", value: report.pageOrigin });
  }
  if (report.flowIssuedAt) {
    rows.push({ label: "issued", value: report.flowIssuedAt });
  }
  if (report.flowExpiresAt) {
    rows.push({ label: "expires", value: report.flowExpiresAt });
  }
  if (report.flowLifespanMinutes !== undefined) {
    rows.push({
      label: "link lifespan",
      value: `${report.flowLifespanMinutes} min`,
    });
  }
  if (report.linkAgeMs !== undefined) {
    rows.push({
      label: "link age",
      value: `${Math.round(report.linkAgeMs / 60000)} min`,
    });
  }
  if (report.kratosErrorId) {
    rows.push({ label: "error", value: report.kratosErrorId });
  }
  if (report.kratosErrorCode !== undefined) {
    rows.push({ label: "code", value: String(report.kratosErrorCode) });
  }
  if (report.userAgent) {
    rows.push({ label: "browser", value: report.userAgent });
  }
  return rows;
}

/** i18n key suffix for the on-screen explanation of each reason. */
export const REASON_MESSAGE_KEY: Record<RecoveryFailureReason, string> = {
  expired: "linkExpiredOnly",
  already_used_or_invalid: "linkAlreadyUsed",
  cookies_blocked: "cookiesBlocked",
  unknown: "linkExpired",
};

export const REASON_MESSAGE_FALLBACK: Record<RecoveryFailureReason, string> = {
  expired: "This link has expired.",
  already_used_or_invalid: "This link has already been used.",
  cookies_blocked:
    "Your browser is blocking cookies, which this page needs to sign you in. Enable cookies for this site and open the link again.",
  unknown: "This link has expired or has already been used.",
};
