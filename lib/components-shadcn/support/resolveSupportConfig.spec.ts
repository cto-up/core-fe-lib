import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSupportConfig } from "./resolveSupportConfig";

/** happy-dom's location is read-only enough that stubbing the whole object is
 *  the simplest way to drive `getDomain()`'s runtime branch. */
function atHost(host: string) {
  vi.stubGlobal("location", { host, href: `https://${host}/` });
}

/** The guard only applies to production builds; vitest reports DEV=true. */
function asProduction() {
  vi.stubEnv("DEV", false);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("resolveSupportConfig", () => {
  it("derives both mailboxes from the deployment domain", () => {
    vi.stubEnv("VITE_APP_BASE_URL", "https://sparkmeee.com");
    expect(resolveSupportConfig(true)).toEqual({
      contactEmail: "contact@sparkmeee.com",
      supportEmail: "support@sparkmeee.com",
      appName: "Sparkmeee",
    });
  });

  it("strips the tenant subdomain", () => {
    vi.stubEnv("VITE_APP_BASE_URL", "https://acme.sparkmeee.com");
    expect(resolveSupportConfig(true)?.supportEmail).toBe(
      "support@sparkmeee.com"
    );
  });

  it("serves each domain an app is deployed to", () => {
    vi.stubEnv("VITE_APP_BASE_URL", "https://taskfactory.eu");
    expect(resolveSupportConfig(true)?.contactEmail).toBe(
      "contact@taskfactory.eu"
    );
  });

  // The whole point of preferring the build-time value: a Cloudflare preview
  // build is served from pages.dev but must still reach the real desk.
  it("prefers the build-time domain over the browser's host", () => {
    asProduction();
    atHost("a1b2c3.lms.pages.dev");
    vi.stubEnv("VITE_APP_BASE_URL", "https://sparkmeee.com");
    expect(resolveSupportConfig(true)?.supportEmail).toBe(
      "support@sparkmeee.com"
    );
  });

  it("refuses to derive an address from a host it does not own", () => {
    asProduction();
    vi.stubEnv("VITE_APP_BASE_URL", "");
    for (const host of [
      "a1b2c3.lms.pages.dev",
      "preview.vercel.app",
      "10.0.0.4",
      "localhost",
      "app.acme.localhost",
    ]) {
      atHost(host);
      expect(resolveSupportConfig(true), host).toBeUndefined();
    }
  });

  it("falls back to the runtime host in dev so the flow is testable locally", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_APP_BASE_URL", "");
    atHost("corpa.ctoup.localhost");
    expect(resolveSupportConfig(true)?.supportEmail).toBe(
      "support@ctoup.localhost"
    );
  });

  it("keeps a brand's inner capital while still deriving the mailboxes", () => {
    vi.stubEnv("VITE_APP_BASE_URL", "https://sparkmeee.com");
    expect(resolveSupportConfig({ appName: "SparkMeee" })).toEqual({
      contactEmail: "contact@sparkmeee.com",
      supportEmail: "support@sparkmeee.com",
      appName: "SparkMeee",
    });
  });

  it("honours a fully explicit config without deriving anything", () => {
    asProduction();
    atHost("a1b2c3.lms.pages.dev");
    expect(
      resolveSupportConfig({
        contactEmail: "hi@acme.test",
        supportEmail: "help@acme.test",
      })?.contactEmail
    ).toBe("hi@acme.test");
  });

  it("renders no desk when the app opts out", () => {
    expect(resolveSupportConfig(false)).toBeUndefined();
  });
});
