import { describe, expect, it } from "vitest";
import { enterableTenantSubdomain } from "./tenant-host";

// A signed-in member of `acme` landed on `app.` (the default tenant) and was
// stopped on "Access Required" instead of being sent to their own tenant.

const acme = { tenant_id: "t-acme", subdomain: "acme", status: "active" };
const beta = { tenant_id: "t-beta", subdomain: "beta", status: "active" };

describe("enterableTenantSubdomain", () => {
  it("picks the newest membership the session can enter", () => {
    expect(
      enterableTenantSubdomain([acme, beta], ["t-acme", "t-beta"], "t-app")
    ).toBe("acme");
  });

  it("skips a membership the session claim does not carry", () => {
    expect(enterableTenantSubdomain([acme, beta], ["t-beta"], "t-app")).toBe(
      "beta"
    );
  });

  it("never sends the user back to the tenant they are on", () => {
    expect(enterableTenantSubdomain([acme], ["t-acme"], "t-acme")).toBeNull();
  });

  it("ignores a membership that is not active", () => {
    expect(
      enterableTenantSubdomain(
        [{ ...acme, status: "pending" }],
        ["t-acme"],
        "t-app"
      )
    ).toBeNull();
  });

  it("has nowhere to send a user with no organization", () => {
    expect(enterableTenantSubdomain([], [], "t-app")).toBeNull();
  });
});
