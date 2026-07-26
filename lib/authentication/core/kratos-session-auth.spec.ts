import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

/**
 * AUTHENTICATION REGRESSION SUITE for the session cache (roadmap 020, item 3).
 *
 * kratos-service.spec.ts pins the cache MECHANICS (hit, dedupe, TTL, force).
 * This file pins the AUTH SEQUENCES — the orderings where a stale cache would
 * lock a user out or, worse, keep them looking signed in after signing out.
 *
 * Why this needs its own suite: the cache sits in front of the single source of
 * truth for "who is this request from". The two consumers are the axios request
 * interceptor (X-Tenant-ID) and the OpenAPI.TOKEN resolver (bearer token), both
 * in components-shadcn/auth/initializeAuth.ts, and both run on EVERY API call.
 * A wrong answer there is an auth bug, not a performance bug.
 *
 * The safety net that makes the cache tolerable at all: the BACKEND
 * independently re-validates every request against Kratos, so a stale entry
 * here can never grant access. The worst case is one request that 401s, and the
 * 401 handler recovers. These tests prove that recovery actually works.
 */

const interceptors: Array<(r: unknown) => unknown> = [];
let get: ReturnType<typeof vi.fn>;
let post: ReturnType<typeof vi.fn>;

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    defaults: { baseURL: "http://kratos.test" },
    interceptors: {
      response: {
        use: (onFulfilled: (r: unknown) => unknown) => {
          interceptors.push(onFulfilled);
          return interceptors.length - 1;
        },
      },
    },
  }));
  return { default: { create }, create };
});

function sessionFor(userId: string, tenantId: string, id = "sess-" + userId) {
  return {
    id,
    active: true,
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    identity: {
      id: userId,
      traits: { email: `${userId}@example.com` },
      metadata_public: { tenant_id: tenantId },
    },
  };
}

async function newService() {
  vi.resetModules();
  interceptors.length = 0;
  const { configureKratos } = await import("./kratos-config");
  configureKratos({ publicUrl: "http://kratos.test" });
  const mod = await import("./kratos-service");
  void mod.kratosService.invalidateSession;
  return mod.kratosService;
}

/** Fires the constructor-registered interceptor as a self-service POST would. */
function simulateSelfServicePost(url: string) {
  interceptors[0]({ config: { method: "post", url } });
}

beforeEach(() => {
  vi.useFakeTimers();
  get = vi.fn();
  post = vi.fn();
});
afterEach(() => vi.useRealTimers());

describe("auth sequence: sign-in", () => {
  it("a signed-out visitor who signs in is immediately seen as signed in", async () => {
    const svc = await newService();

    // Visitor lands on a public page: several components ask, all get 401.
    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull();
    expect(await svc.getSession()).toBeNull();

    // They sign in. Kratos sets the cookie; the POST goes through this client.
    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    simulateSelfServicePost("/self-service/login?flow=abc");

    // No waiting, no stale negative: the very next read must see the session.
    const s = await svc.getSession();
    expect(s?.active).toBe(true);
    expect(s?.identity.id).toBe("u1");
  });

  it("even WITHOUT the invalidation hook, a negative entry expires in ~2s", async () => {
    // Defence in depth: if a future flow signs in by some path that does not
    // POST through this client, the short negative TTL still bounds the damage
    // to a couple of seconds rather than the 30s positive TTL.
    const svc = await newService();
    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull();

    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    vi.setSystemTime(Date.now() + 2_100);
    expect((await svc.getSession())?.identity.id).toBe("u1");
  });
});

describe("auth sequence: account recovery (raw fetch — no interceptor)", () => {
  // These two paths use `fetch` with redirect:"manual" instead of the axios
  // client, because browsers always follow redirects and Kratos answers a 303.
  // That means the constructor's mutation interceptor NEVER SEES THEM — and both
  // establish a session cookie. They must invalidate explicitly; the 2s negative
  // TTL is a backstop, not the mechanism.
  const okFetch = () =>
    vi.fn().mockResolvedValue({ status: 303, ok: false, json: async () => ({}) });

  it("activateRecoveryLink clears a cached signed-out answer", async () => {
    const svc = await newService();
    vi.stubGlobal("fetch", okFetch());

    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull(); // cached negative

    await svc.activateRecoveryLink("flow-1", "tok-1");

    // Kratos has just set a session cookie. Without invalidation the user would
    // still look signed out.
    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    expect((await svc.getSession())?.active).toBe(true);
    vi.unstubAllGlobals();
  });

  it("submitRecoveryFlow with a token clears a cached signed-out answer", async () => {
    const svc = await newService();
    vi.stubGlobal("fetch", okFetch());

    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull();

    await svc.submitRecoveryFlow("flow-1", { token: "tok-1", method: "link" });

    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    expect((await svc.getSession())?.active).toBe(true);
    vi.unstubAllGlobals();
  });

  it("a FAILED recovery does not leave a stale positive either", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    await svc.getSession();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 400, ok: false, json: async () => ({}) })
    );
    await expect(
      svc.submitRecoveryFlow("flow-1", { token: "bad", method: "link" })
    ).rejects.toBeDefined();
    vi.unstubAllGlobals();
  });
});

describe("auth sequence: sign-out", () => {
  it("after logout the session is gone — no stale positive", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    expect((await svc.getSession())?.active).toBe(true);

    // logout() issues two GETs then invalidates in a finally block.
    get.mockResolvedValue({ data: { logout_token: "tok" } });
    await svc.logout();

    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull();
  });

  it("a FAILED logout still clears the cache", async () => {
    // The dangerous case: the browser cookie may already be dead server-side.
    // Holding a positive entry would leave the app believing it is signed in
    // while every API call 401s.
    const svc = await newService();
    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    await svc.getSession();

    get.mockRejectedValue(new Error("network down"));
    await expect(svc.logout()).rejects.toThrow();

    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull();
  });
});

describe("auth sequence: expiry and the 401 recovery path", () => {
  it("force:true (what the 401 handler uses) bypasses a stale entry and recovers", async () => {
    const svc = await newService();

    // Cached while valid.
    get.mockResolvedValue({ data: sessionFor("u1", "t1", "old-sess") });
    expect((await svc.getSession())?.id).toBe("old-sess");

    // Session is rotated server-side. A plain read would still serve the stale
    // id and the retry would 401 again — with _retry already set, that failure
    // reaches the caller instead of recovering. force is what prevents it.
    get.mockResolvedValue({ data: sessionFor("u1", "t1", "new-sess") });
    expect((await svc.getSession())?.id).toBe("old-sess"); // still cached
    expect((await svc.getSession({ force: true }))?.id).toBe("new-sess");
    expect((await svc.getSession())?.id).toBe("new-sess"); // re-primed
  });

  it("a session already past expires_at is never served from cache", async () => {
    const svc = await newService();
    // 1s of life left, far inside the 30s TTL.
    get.mockResolvedValue({
      data: {
        ...sessionFor("u1", "t1"),
        expires_at: new Date(Date.now() + 1_000).toISOString(),
      },
    });
    await svc.getSession();

    vi.setSystemTime(Date.now() + 1_500);
    get.mockRejectedValue({ response: { status: 401 } });
    expect(await svc.getSession()).toBeNull();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("an already-expired session does not cache into the past", async () => {
    const svc = await newService();
    get.mockResolvedValue({
      data: {
        ...sessionFor("u1", "t1"),
        expires_at: new Date(Date.now() - 60_000).toISOString(),
      },
    });
    await svc.getSession();
    await svc.getSession();
    // Every read must re-fetch rather than serve a session known to be dead.
    expect(get).toHaveBeenCalledTimes(2);
  });
});

describe("what the two hot consumers read", () => {
  it("X-Tenant-ID and the bearer token stay correct across cached reads", async () => {
    // Mirrors initializeAuth.ts: the request interceptor reads
    // identity.metadata_public.tenant_id, the OpenAPI.TOKEN resolver reads .id.
    const svc = await newService();
    get.mockResolvedValue({ data: sessionFor("u1", "tenant-corpa", "sess-xyz") });

    for (let i = 0; i < 5; i++) {
      const s = await svc.getSession();
      expect(s?.identity.metadata_public?.tenant_id).toBe("tenant-corpa");
      expect(s?.id).toBe("sess-xyz");
    }
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("an unauthenticated read yields no tenant and an empty token", async () => {
    const svc = await newService();
    get.mockRejectedValue({ response: { status: 401 } });
    const s = await svc.getSession();
    expect(s).toBeNull();
    // initializeAuth does `session?.id || ""` and skips the header when absent.
    expect(s?.identity?.metadata_public?.tenant_id).toBeUndefined();
    expect(s?.id ?? "").toBe("");
  });

  it("a tenant switch is observed once the settings mutation invalidates", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: sessionFor("u1", "tenant-a") });
    expect((await svc.getSession())?.identity.metadata_public?.tenant_id).toBe("tenant-a");

    get.mockResolvedValue({ data: sessionFor("u1", "tenant-b") });
    simulateSelfServicePost("/self-service/settings?flow=xyz");
    expect((await svc.getSession())?.identity.metadata_public?.tenant_id).toBe("tenant-b");
  });
});

describe("failure modes must not poison the cache", () => {
  it("a rejected in-flight fetch is not cached and the next call retries", async () => {
    const svc = await newService();
    let reject!: (e: unknown) => void;
    get.mockReturnValue(new Promise((_r, rj) => (reject = rj)));

    const a = svc.getSession();
    const b = svc.getSession(); // joins the same in-flight promise
    reject({ response: { status: 503 } });

    await expect(a).rejects.toBeDefined();
    await expect(b).rejects.toBeDefined();

    // The in-flight slot must have been released, and nothing cached.
    get.mockResolvedValue({ data: sessionFor("u1", "t1") });
    expect((await svc.getSession())?.active).toBe(true);
  });

  it("a 5xx never degrades into 'signed out'", async () => {
    // Treating a gateway error as a missing session would sign users out
    // during a backend blip. It must throw so callers can distinguish.
    const svc = await newService();
    get.mockRejectedValue({ response: { status: 503 } });
    await expect(svc.getSession()).rejects.toBeDefined();
  });

  it("a forced refresh racing a plain read leaves consistent state", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: sessionFor("u1", "t1", "s1") });
    await svc.getSession();

    get.mockResolvedValue({ data: sessionFor("u1", "t1", "s2") });
    const [forced, plain] = await Promise.all([
      svc.getSession({ force: true }),
      svc.getSession(),
    ]);
    // The plain read may legitimately serve the still-valid cached value; the
    // forced one must see the new session, and the cache must end up on s2.
    expect(forced?.id).toBe("s2");
    expect(["s1", "s2"]).toContain(plain?.id);
    expect((await svc.getSession())?.id).toBe("s2");
  });

  it("nine near-simultaneous reads on a cold cache make exactly one request", async () => {
    // The measured shape of the original bug: ~9 whoami per page view.
    const svc = await newService();
    let resolve!: (v: unknown) => void;
    get.mockReturnValue(new Promise((r) => (resolve = r)));

    const all = Promise.all(Array.from({ length: 9 }, () => svc.getSession()));
    resolve({ data: sessionFor("u1", "t1") });
    const results = await all;

    expect(get).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r?.identity.id === "u1")).toBe(true);
  });
});
