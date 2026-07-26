import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

/**
 * Session-cache behaviour (roadmap 020, item 3).
 *
 * The audit measured ~9 `GET /kratos/sessions/whoami` per page view — 63% of
 * all frontend HTTP requests and 84% of the time the frontend spent waiting on
 * the network. These tests pin the properties that make that number small AND
 * keep it correct; the second half matters more than the first, because a
 * cache that serves a dead session is a worse bug than a slow app.
 */

const interceptors: Array<(r: unknown) => unknown> = [];
let get: ReturnType<typeof vi.fn>;
let post: ReturnType<typeof vi.fn>;

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
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

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "sess-1",
    active: true,
    // Far future so expires_at never becomes the binding constraint by accident.
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    identity: { id: "user-1", metadata_public: { tenant_id: "t-1" } },
    ...overrides,
  };
}

/**
 * Fresh module instance per test — the cache is instance state.
 *
 * kratos-config must be re-imported AFTER resetModules: its `_config` is
 * module-level state, so configuring the pre-reset copy would leave the copy
 * that kratos-service actually imports unconfigured.
 */
async function newService() {
  vi.resetModules();
  interceptors.length = 0;
  const { configureKratos } = await import("./kratos-config");
  configureKratos({ publicUrl: "http://kratos.test" });
  const mod = await import("./kratos-service");
  // Touch the proxy so the singleton is constructed and the interceptor registers.
  void mod.kratosService.invalidateSession;
  return mod.kratosService;
}

beforeEach(() => {
  vi.useFakeTimers();
  get = vi.fn();
  post = vi.fn();
  (axios.create as unknown as ReturnType<typeof vi.fn>).mockClear?.();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("kratosService.getSession caching", () => {
  it("serves repeat calls from cache — one network round-trip, not N", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });

    for (let i = 0; i < 9; i++) await svc.getSession();

    // The whole point: nine reads, one whoami.
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("de-duplicates concurrent callers into a single in-flight request", async () => {
    const svc = await newService();
    let resolve!: (v: unknown) => void;
    get.mockReturnValue(new Promise((r) => (resolve = r)));

    // The real shape of the bug: the axios request interceptor and the
    // OpenAPI.TOKEN resolver fire microseconds apart, before any response has
    // populated the cache.
    const all = Promise.all([
      svc.getSession(),
      svc.getSession(),
      svc.getSession(),
    ]);
    expect(get).toHaveBeenCalledTimes(1);

    resolve({ data: session() });
    const results = await all;
    expect(results.every((r) => r?.id === "sess-1")).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("re-fetches once the TTL lapses", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });

    await svc.getSession();
    vi.setSystemTime(Date.now() + 31_000);
    await svc.getSession();

    expect(get).toHaveBeenCalledTimes(2);
  });

  it("never caches a session past its own expires_at", async () => {
    const svc = await newService();
    // Session dies in 5s — well inside the 30s TTL, so expires_at must win.
    get.mockResolvedValue({
      data: session({ expires_at: new Date(Date.now() + 5_000).toISOString() }),
    });

    await svc.getSession();
    vi.setSystemTime(Date.now() + 6_000);
    await svc.getSession();

    expect(get).toHaveBeenCalledTimes(2);
  });

  it("caches a 401 only briefly, so a fresh sign-in is picked up", async () => {
    const svc = await newService();
    get.mockRejectedValue({ response: { status: 401 } });

    expect(await svc.getSession()).toBeNull();
    expect(await svc.getSession()).toBeNull();
    expect(get).toHaveBeenCalledTimes(1); // negative result is cached…

    vi.setSystemTime(Date.now() + 2_500);
    get.mockResolvedValue({ data: session() });
    expect(await svc.getSession()).not.toBeNull(); // …but only for ~2s
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("force bypasses the cache and re-primes it", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });

    await svc.getSession();
    get.mockResolvedValue({ data: session({ id: "sess-2" }) });

    expect((await svc.getSession({ force: true }))?.id).toBe("sess-2");
    // Subsequent cached reads see the refreshed value, not the stale one.
    expect((await svc.getSession())?.id).toBe("sess-2");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("invalidateSession drops the entry", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });

    await svc.getSession();
    svc.invalidateSession();
    await svc.getSession();

    expect(get).toHaveBeenCalledTimes(2);
  });

  it("logout invalidates even when the logout call fails", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });
    await svc.getSession();

    get.mockRejectedValue(new Error("network down"));
    await expect(svc.logout()).rejects.toThrow();

    // A half-completed logout may have killed the cookie server-side; keeping a
    // positive entry would leave the app believing it is still signed in.
    get.mockResolvedValue({ data: session() });
    await svc.getSession();
    expect(get).toHaveBeenCalledTimes(3); // initial, failed logout, re-fetch
  });

  it("any self-service mutation invalidates the cache", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });
    await svc.getSession();
    expect(get).toHaveBeenCalledTimes(1);

    // Simulate the constructor-registered response interceptor seeing a POST
    // to a self-service endpoint (sign-in, settings, AAL2 upgrade, …).
    expect(interceptors.length).toBeGreaterThan(0);
    interceptors[0]({
      config: { method: "post", url: "/self-service/login?flow=abc" },
    });

    await svc.getSession();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("a self-service GET does NOT invalidate — flow init is not a mutation", async () => {
    const svc = await newService();
    get.mockResolvedValue({ data: session() });
    await svc.getSession();

    interceptors[0]({
      config: { method: "get", url: "/self-service/login/browser" },
    });

    await svc.getSession();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("propagates non-401 errors instead of caching them as 'signed out'", async () => {
    const svc = await newService();
    get.mockRejectedValue({ response: { status: 503 } });

    await expect(svc.getSession()).rejects.toBeDefined();
    // A 5xx must not leave a poisoned entry behind.
    get.mockResolvedValue({ data: session() });
    expect(await svc.getSession()).not.toBeNull();
  });
});
