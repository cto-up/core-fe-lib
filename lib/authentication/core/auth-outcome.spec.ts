import { describe, it, expect } from "vitest";
import { classifyAuthResponse } from "./auth-outcome";

// The single highest-consequence distinction in the auth path.
//
// A real 401 and an unreachable server look identical from the outside — every
// request fails — and demand opposite behaviour. Neither half of this file
// means anything without the other.

describe("a confirmed session", () => {
  it("is recognised", () => {
    expect(
      classifyAuthResponse({ id: "s1", identity: { id: "i1" }, active: true })
    ).toBe("authenticated");
  });
});

describe("a real refusal signs the user out", () => {
  it("reads a resolved null as no session", () => {
    // fetchSession answers null for a 401 — it does not throw.
    expect(classifyAuthResponse(null)).toBe("unauthenticated");
  });

  it("reads a thrown 401 as no session", () => {
    expect(classifyAuthResponse({ response: { status: 401 } })).toBe(
      "unauthenticated"
    );
  });

  it("reads a 403 the same way", () => {
    expect(classifyAuthResponse({ response: { status: 403 } })).toBe(
      "unauthenticated"
    );
  });

  it("handles a bare fetch Response too", () => {
    expect(classifyAuthResponse({ status: 401 })).toBe("unauthenticated");
  });
});

describe("a failed fetch does NOT sign the user out", () => {
  // This is the bug: `catch { updateUserFromSession(null) }` treated every one
  // of these as a sign-out.
  const failures: Array<[string, unknown]> = [
    ["a fetch TypeError", new TypeError("Failed to fetch")],
    ["an axios network error", { code: "ERR_NETWORK", message: "Network Error" }],
    ["a timeout", { code: "ECONNABORTED", message: "timeout" }],
    ["a 500", { response: { status: 500 } }],
    ["a 502", { response: { status: 502 } }],
    ["a 503", { response: { status: 503 } }],
    ["a 504", { response: { status: 504 } }],
    [
      "an aborted request",
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    ],
    ["an unrecognised error", new Error("who knows")],
    ["undefined", undefined],
  ];

  for (const [label, failure] of failures) {
    it(`treats ${label} as network-unavailable`, () => {
      expect(classifyAuthResponse(failure)).toBe("network-unavailable");
    });
  }

  it("fails toward KEEPING the session when it cannot tell", () => {
    // Retaining a session we could not confirm grants nothing: the backend
    // re-validates every request, so the worst case is one 401 the existing
    // handler recovers from. Clearing one destroys work in flight.
    expect(classifyAuthResponse({ weird: true })).toBe("network-unavailable");
  });
});
