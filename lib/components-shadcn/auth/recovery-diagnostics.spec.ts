import { describe, it, expect } from "vitest";
import {
  buildDiagnosticRows,
  classifyRecoveryFailure,
  detectInAppBrowser,
  registrableDomain,
  type RecoveryFailureFacts,
  type RecoveryFailureReport,
} from "./recovery-diagnostics";

const NOW = Date.parse("2026-08-05T12:00:00Z");

const facts = (
  over: Partial<RecoveryFailureFacts> = {}
): RecoveryFailureFacts =>
  ({
    hadToken: true,
    cookiesEnabled: true,
    visibleCookieCount: 3,
    now: NOW,
    ...over,
  }) as RecoveryFailureFacts;

describe("classifyRecoveryFailure", () => {
  it("outranks a live flow when the functional cookie probe failed", () => {
    // The whole point of the probe: `cookieEnabled` reports a global
    // preference and stays true under per-site blocking, so it alone would
    // have called this "already used" and sent the user in a circle.
    const reason = classifyRecoveryFailure(
      facts({
        cookiesEnabled: true,
        cookieWriteWorks: false,
        flowExpiresAt: new Date(NOW + 3_600_000).toISOString(),
      })
    );
    expect(reason).toBe("cookies_blocked");
  });

  it("catches a browser that allows host cookies but rejects domain-scoped ones", () => {
    // Kratos sets Domain=.example.com so the session is shared across tenant
    // subdomains. Allowing one and refusing the other breaks exactly this flow
    // while the rest of the site keeps working.
    const reason = classifyRecoveryFailure(
      facts({
        cookieWriteWorks: true,
        cookieDomainWriteWorks: false,
        flowExpiresAt: new Date(NOW + 3_600_000).toISOString(),
      })
    );
    expect(reason).toBe("cookies_blocked");
  });

  it("does not treat an undefined probe as a failure", () => {
    // A probe that threw is unknown, not negative — guessing "cookies blocked"
    // here would hide a genuinely expired link.
    const reason = classifyRecoveryFailure(
      facts({
        cookieWriteWorks: undefined,
        flowExpiresAt: new Date(NOW - 1000).toISOString(),
      })
    );
    expect(reason).toBe("expired");
  });

  it("blames the browser when cookies are disabled, whatever the flow says", () => {
    // Load-bearing precedence: a blocked-cookie browser redeems the token fine
    // server-side and still ends up session-less. Calling that "expired" sends
    // the user for a replacement link that cannot work either.
    const reason = classifyRecoveryFailure(
      facts({
        cookiesEnabled: false,
        flowExpiresAt: new Date(NOW + 60_000).toISOString(),
      })
    );
    expect(reason).toBe("cookies_blocked");
  });

  it("reports expired when the flow's expiry is in the past", () => {
    const reason = classifyRecoveryFailure(
      facts({ flowExpiresAt: new Date(NOW - 1000).toISOString() })
    );
    expect(reason).toBe("expired");
  });

  it("treats the exact expiry instant as expired", () => {
    const reason = classifyRecoveryFailure(
      facts({ flowExpiresAt: new Date(NOW).toISOString() })
    );
    expect(reason).toBe("expired");
  });

  it("reports already-used when the flow is still live but there is no session", () => {
    const reason = classifyRecoveryFailure(
      facts({ flowExpiresAt: new Date(NOW + 3_600_000).toISOString() })
    );
    expect(reason).toBe("already_used_or_invalid");
  });

  it("says unknown rather than guessing when the flow could not be read back", () => {
    expect(classifyRecoveryFailure(facts())).toBe("unknown");
  });

  it("says unknown when the expiry timestamp is unparseable", () => {
    const reason = classifyRecoveryFailure(
      facts({ flowExpiresAt: "not-a-date" })
    );
    expect(reason).toBe("unknown");
  });
});

describe("detectInAppBrowser", () => {
  it("names a mail/social app WebView", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]"
      )
    ).toBe("FBAN");
    expect(detectInAppBrowser("Mozilla/5.0 ... Outlook-iOS/2.0")).toBe(
      "Outlook-iOS"
    );
  });

  it("catches the bare Android WebView token", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit/537.36"
      )
    ).toBe("AndroidWebView");
  });

  it("leaves a normal browser unflagged", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      )
    ).toBeUndefined();
  });
});

describe("registrableDomain", () => {
  it("takes the last two labels of a tenant subdomain", () => {
    expect(registrableDomain("learn.sparkmeee.com")).toBe("sparkmeee.com");
  });

  it("declines localhost and IP literals, which cannot carry a domain cookie", () => {
    expect(registrableDomain("localhost")).toBeUndefined();
    expect(registrableDomain("127.0.0.1")).toBeUndefined();
    expect(registrableDomain("")).toBeUndefined();
  });
});

describe("buildDiagnosticRows", () => {
  const report = (over: Partial<RecoveryFailureReport> = {}) =>
    ({
      stage: "activate",
      reason: "expired",
      hadToken: true,
      cookiesEnabled: true,
      visibleCookieCount: 2,
      now: NOW,
      ...over,
    }) as RecoveryFailureReport;

  it("always carries the fields needed to triage, even when nothing optional is known", () => {
    const labels = buildDiagnosticRows(report()).map((r) => r.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "reason",
        "stage",
        "flow",
        "token",
        "cookies allowed",
        "cookie write",
        "domain cookie",
      ])
    );
  });

  it("renders an unrun probe as unknown rather than a false negative", () => {
    const rows = buildDiagnosticRows(report({ cookieWriteWorks: undefined }));
    expect(rows.find((r) => r.label === "cookie write")?.value).toBe("unknown");
  });

  it("surfaces the server's real link lifespan, which reveals an unapplied config", () => {
    const rows = buildDiagnosticRows(report({ flowLifespanMinutes: 60 }));
    expect(rows.find((r) => r.label === "link lifespan")?.value).toBe("60 min");
  });

  it("never emits the recovery token", () => {
    const serialized = JSON.stringify(buildDiagnosticRows(report()));
    expect(serialized).not.toMatch(
      /token"\s*,\s*"value"\s*:\s*"(?!present|absent)/
    );
  });
});
