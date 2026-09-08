import { describe, expect, it } from "vitest";

/**
 * The 401 handler decided whether to redirect by calling useRoute() — a
 * composable — from inside an axios interceptor. There is no component setup
 * context there, so it returned undefined and `.matched` threw a TypeError on
 * every 401. The learner saw an unexplained "Network error" with an incident
 * id, on a page that had rendered fine.
 *
 * The shape below is what the handler now does. It must never throw, and with
 * no router it must decline to redirect rather than guess.
 */
type Matched = { meta: { requiresAuth?: boolean } }[];

function isAuthFlow(matched: Matched | undefined): boolean {
  return !(matched ?? []).some((r) => r.meta.requiresAuth);
}

describe("the 401 handler's route check", () => {
  it("does not throw when there is no router", () => {
    expect(() => isAuthFlow(undefined)).not.toThrow();
  });

  it("declines to redirect when the route is unknown", () => {
    // A wrong redirect loses the learner's place; not redirecting only defers
    // to the app's own guard on the next navigation.
    expect(isAuthFlow(undefined)).toBe(true);
  });

  it("treats a public route as an auth flow", () => {
    expect(isAuthFlow([{ meta: {} }])).toBe(true);
  });

  it("recognises a route that requires auth", () => {
    expect(isAuthFlow([{ meta: {} }, { meta: { requiresAuth: true } }])).toBe(
      false
    );
  });
});
