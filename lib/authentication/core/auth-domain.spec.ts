import { describe, it, expect } from "vitest";
import {
  buildWebAuthnVerifyUrl,
  buildWebAuthnRegisterUrl,
} from "./auth-domain";

function at(url: string) {
  (
    globalThis as unknown as { happyDOM: { setURL(u: string): void } }
  ).happyDOM.setURL(url);
}

describe("the WebAuthn URLs on the auth host", () => {
  it("verify from an /admin page targets the auth host's /verify/webauthn", () => {
    at("https://acme.tessellion.fr/admin/secrets");
    expect(buildWebAuthnVerifyUrl()).toBe(
      "https://auth.tessellion.fr/verify/webauthn?return_to=" +
        encodeURIComponent("https://acme.tessellion.fr/admin/secrets")
    );
  });

  it("register from an /admin page targets the auth host's /register/webauthn", () => {
    at("https://acme.tessellion.fr/admin/tenant-profile");
    expect(buildWebAuthnRegisterUrl()).toMatch(
      /^https:\/\/auth\.tessellion\.fr\/register\/webauthn\?return_to=/
    );
  });

  it("popup mode is flagged", () => {
    at("https://acme.tessellion.fr/agents");
    expect(buildWebAuthnVerifyUrl(undefined, "popup")).toMatch(
      /^https:\/\/auth\.tessellion\.fr\/verify\/webauthn\?return_to=.*&mode=popup$/
    );
  });
});
