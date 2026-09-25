import { describe, it, expect } from "vitest";
import { safeRedirectTarget } from "./safe-redirect";

const here = "https://acme.sparkmeee.com/signin?from=x";
const api = ["https://api.sparkmeee.io"];
const safe = (t: string | undefined) => safeRedirectTarget(t, "/", here, api);

describe("a redirect target taken from a link", () => {
  it("keeps an app path", () => {
    expect(safe("/lms/courses?x=1#a")).toBe("/lms/courses?x=1#a");
  });

  it("falls back when there is none", () => {
    expect(safe(undefined)).toBe("/");
    expect(safe("")).toBe("/");
  });

  it("keeps another subdomain of the same base domain", () => {
    expect(safe("https://auth.sparkmeee.com/verify")).toBe(
      "https://auth.sparkmeee.com/verify"
    );
    expect(safe("https://sparkmeee.com/")).toBe("https://sparkmeee.com/");
  });

  it("keeps the configured API origin", () => {
    expect(safe("https://api.sparkmeee.io/oauth/login?login_challenge=c")).toBe(
      "https://api.sparkmeee.io/oauth/login?login_challenge=c"
    );
  });

  it("works on a local dev host", () => {
    expect(
      safeRedirectTarget(
        "http://auth.ctoup.localhost:5173/x",
        "/",
        "http://corpa.ctoup.localhost:5173/",
        []
      )
    ).toBe("http://auth.ctoup.localhost:5173/x");
  });
});

describe("a crafted target never leaves the product", () => {
  const attacks: Array<[string, string]> = [
    ["a foreign host", "https://evil.example/phish"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash host", "/\\evil.example"],
    ["a look-alike suffix", "https://evilsparkmeee.com/"],
    ["the base domain as a subdomain", "https://sparkmeee.com.evil.example/"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["a data: URL", "data:text/html,<script>alert(1)</script>"],
    ["garbage", "not a url"],
  ];
  it.each(attacks)("rejects %s", (_name, target) => {
    expect(safe(target)).toBe("/");
  });

  it("uses the caller's fallback", () => {
    expect(safeRedirectTarget("https://evil.example", "/home", here, api)).toBe(
      "/home"
    );
  });
});
