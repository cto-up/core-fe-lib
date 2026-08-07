/**
 * Ory Kratos Service
 *
 * This service provides methods to interact with Ory Kratos API
 * for authentication and identity management.
 */

/**
 * Kratos flow types
 */
export enum KratosFlowType {
  Login = "login",
  Registration = "registration",
  Recovery = "recovery",
  Settings = "settings",
  Verification = "verification",
}

import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
} from "axios";
import { getKratosConfig } from "./kratos-config";

/** Extensible traits object for identity */
type TraitsRecord = Record<string, string | undefined>;

/** Metadata object for identity with predefined and custom fields */
type MetadataRecord = Record<string, unknown>;

/** Node attributes from Kratos flow UI */
type FlowNodeAttributes = Record<string, string | number | boolean | undefined>;

/** Error handler for axios requests */
type AxiosErrorResponse = AxiosError<{
  ui?: { messages?: Array<{ text: string }> };
  error?: { message?: string };
}>;

export interface KratosSession {
  id: string;
  active: boolean;
  expires_at: string;
  authenticated_at: string;
  identity: {
    id: string;
    schema_id: string;
    schema_url: string;
    state: string;
    state_changed_at: string;
    traits: TraitsRecord & {
      email: string;
      name?: string;
      subdomain?: string;
    };
    verifiable_addresses?: Array<{
      id: string;
      value: string;
      verified: boolean;
      via: string;
      status: string;
    }>;
    metadata_public?: MetadataRecord & {
      global_roles?: string[];
      tenant_memberships?: Array<{
        tenant_id: string;
        roles: string[];
      }>;
    };
  };
}

export interface KratosFlowNode {
  type: string;
  group: string;
  attributes: FlowNodeAttributes;
  messages?: Array<{ id: number; text: string; type: string }>;
  meta?: { label?: { text: string } };
}

export interface KratosFlow {
  id: string;
  type: string;
  expires_at: string;
  issued_at: string;
  request_url: string;
  ui: {
    action: string;
    method: string;
    nodes: KratosFlowNode[];
    messages?: Array<{ id: number; text: string; type: string }>;
  };
}

/** What `GET /self-service/errors?id=…` returns. */
export interface KratosFlowError {
  id: string;
  error?: {
    code?: number;
    status?: string;
    reason?: string;
    message?: string;
  };
}

/** A social sign-in button Kratos advertises on a login/registration flow. */
export interface KratosOidcProvider {
  /** The provider id from kratos.yml — submitted back as the `provider` field. */
  value: string;
  /** Kratos's own label for the button, e.g. "Google". */
  label: string;
}

/**
 * Brand spellings a plain capitalisation would get wrong.
 */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  gitlab: "GitLab",
  microsoft: "Microsoft",
  linkedin: "LinkedIn",
  apple: "Apple",
  facebook: "Facebook",
};

/**
 * A human display name for a provider id.
 *
 * Deliberately NOT Kratos's own `meta.label.text`: that is a whole sentence
 * ("Sign in with google", lowercased provider and all), so dropping it into a
 * "Continue with {provider}" button yields "Continue with Sign in with google".
 * The id is the stable thing; the wording is ours.
 */
function providerDisplayName(id: string): string {
  return PROVIDER_DISPLAY_NAMES[id.toLowerCase()] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * The social providers a flow offers, derived from the flow itself rather than
 * from app config: a provider that is not configured in kratos.yml produces no
 * node, so no button appears and nothing has to be kept in sync.
 */
export function getOidcProviders(flow: KratosFlow): KratosOidcProvider[] {
  return flow.ui.nodes
    .filter(
      (node) => node.group === "oidc" && node.attributes?.name === "provider"
    )
    .map((node) => {
      const value = String(node.attributes?.value ?? "");
      return { value, label: providerDisplayName(value) };
    })
    .filter((provider) => provider.value !== "");
}

export interface KratosIdentity {
  id: string;
  schema_id: string;
  traits: TraitsRecord & {
    email: string;
    name?: string;
    subdomain?: string;
  };
  metadata_public?: MetadataRecord & {
    global_roles?: string[];
    tenant_memberships?: Array<{
      tenant_id: string;
      roles: string[];
    }>;
  };
}

/**
 * Generic response from Kratos flow submissions
 * Can be a KratosSession (success) or KratosFlow (with validation errors)
 */
export type KratosFlowResponse =
  | KratosSession
  | KratosFlow
  | Record<string, unknown>;

/**
 * Login Flow Data Types - Discriminated Union for Type-Safe Method-Specific Payloads
 */

/** Common fields required by all login methods */
interface BaseLoginFlowData {
  method: string;
  csrf_token: string;
  identifier: string;
}

/** Password-based authentication */
export interface PasswordLoginFlowData extends BaseLoginFlowData {
  method: "password";
  password: string;
}

/** TOTP (Time-based One-Time Password) authentication for AAL2 */
export interface TotpLoginFlowData extends BaseLoginFlowData {
  method: "totp";
  totp_code: string;
}

/** Recovery code (lookup_secret) authentication for AAL2 */
export interface LookupSecretLoginFlowData extends BaseLoginFlowData {
  method: "lookup_secret";
  lookup_secret: string;
}

/** WebAuthn authentication for AAL2 */
export interface WebAuthnLoginFlowData extends BaseLoginFlowData {
  method: "webauthn";
  webauthn_login: string;
}

/** Discriminated union: only one method type allowed per call */
export type LoginFlowData =
  | PasswordLoginFlowData
  | TotpLoginFlowData
  | LookupSecretLoginFlowData
  | WebAuthnLoginFlowData;

/**
 * Session cache TTLs (roadmap 020, item 3).
 *
 * A positive result is reusable for as long as we are willing to be wrong about
 * a session that died elsewhere; a negative one must expire fast so a fresh
 * sign-in is picked up promptly.
 */
const SESSION_TTL_MS = 30_000;
const SESSION_NEGATIVE_TTL_MS = 2_000;

interface SessionCacheEntry {
  value: KratosSession | null;
  expiresAt: number;
}

class KratosService {
  private readonly client: AxiosInstance;

  /**
   * ── Session cache (roadmap 020, item 3) ────────────────────────────────────
   *
   * THE PROBLEM. `getSession()` is called from two per-request hot paths in
   * `components-shadcn/auth/initializeAuth.ts`: the global axios REQUEST
   * interceptor (to read `tenant_id` for the `X-Tenant-ID` header) and the
   * `OpenAPI.TOKEN` resolver (invoked by every generated client call). Each was
   * an uncached network round-trip, so every API call was preceded by one or
   * two serialized `GET /kratos/sessions/whoami`.
   *
   * Measured in Sentry over 14 days: 17,850 sampled calls at 20% sampling
   * (~89,000 real), avg 536 ms, p95 1,767 ms — 63% of all frontend HTTP
   * requests and 84% of all time the frontend spent waiting on the network.
   * Roughly nine session lookups per page view.
   *
   * THE FIX, in two parts:
   *   1. In-flight de-duplication. Concurrent callers share one promise. This
   *      alone collapses the burst, because the interceptor and the TOKEN
   *      resolver fire microseconds apart for the same request.
   *   2. A short TTL cache, bounded additionally by the session's own
   *      `expires_at` so we never serve a session we know has lapsed.
   *
   * WHY THIS IS SAFE — and why it is NOT the backend cache that roadmap 018 T5
   * dropped. The cached value is used for exactly two things: the `X-Tenant-ID`
   * request header and the bearer token. Neither is an authorization decision:
   * the BACKEND independently re-validates every request against Kratos, so a
   * stale entry here cannot grant access to anything. The worst case is one
   * request that 401s — and the existing 401 handler already invalidates and
   * redirects. 018 T5 was different in kind: it cached a tenant- and
   * path-dependent authorization *verdict* on the server.
   *
   * Cross-tab logout is the one behaviour change: this tab may keep a positive
   * entry for up to SESSION_TTL_MS after another tab signs out. The next
   * request then 401s and recovers, exactly as it would today for any request
   * already in flight at the moment of logout.
   */
  private sessionCache: SessionCacheEntry | null = null;
  private sessionInFlight: Promise<KratosSession | null> | null = null;

  constructor() {
    const baseURL = getKratosConfig().publicUrl;

    this.client = axios.create({
      baseURL: baseURL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Any self-service MUTATION may change who we are — sign-in, sign-out,
    // registration, recovery, an AAL2 upgrade, a settings submission that
    // rewrites traits or metadata. Rather than remembering to invalidate at
    // nine call sites (and at the tenth one added later), drop the cache on
    // every non-GET to /self-service/ that this client issues. Registered in
    // the constructor so it runs before any caller-supplied interceptor.
    this.client.interceptors.response.use(
      (response) => {
        const method = (response.config.method ?? "get").toLowerCase();
        if (
          method !== "get" &&
          (response.config.url ?? "").includes("/self-service/")
        ) {
          this.invalidateSession();
        }
        return response;
      },
      (error) => Promise.reject(error)
    );

    console.log("🔧 Kratos service initialized with baseURL:", baseURL);
  }

  /**
   * Attach a response interceptor to the internal Kratos axios client.
   * Use this to handle Kratos-specific errors (e.g. session_refresh_required)
   * that originate from self-service flows and bypass the global axios instance.
   */
  addResponseInterceptor(
    onFulfilled?: (
      response: AxiosResponse
    ) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: unknown) => unknown
  ): number {
    return this.client.interceptors.response.use(onFulfilled, onRejected);
  }

  /**
   * Drop any cached session.
   *
   * MUST be called whenever the session's identity may have changed underneath
   * us: sign-in, sign-out, AAL2 upgrade, a settings submission that alters
   * traits or metadata, and on any 401 from the API. Cheap and idempotent —
   * when in doubt, call it.
   */
  invalidateSession(): void {
    this.sessionCache = null;
    this.sessionInFlight = null;
  }

  /**
   * Get the current session.
   * Returns null if not authenticated (401) — this is normal, not an error.
   *
   * Served from a short-lived in-memory cache with in-flight de-duplication;
   * see the `sessionCache` field for the full rationale and safety argument.
   * Pass `{ force: true }` to bypass the cache and refresh it (used by paths
   * that have just mutated the identity and need to observe the result).
   */
  async getSession(
    options: { force?: boolean } = {}
  ): Promise<KratosSession | null> {
    if (!options.force) {
      const cached = this.sessionCache;
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
      // A fetch is already running — join it instead of opening a second
      // connection. This is what collapses the interceptor/TOKEN-resolver pair.
      if (this.sessionInFlight) {
        return this.sessionInFlight;
      }
    }

    const inFlight = this.fetchSession()
      .then((session) => {
        this.sessionCache = {
          value: session,
          expiresAt: this.sessionCacheDeadline(session),
        };
        return session;
      })
      .finally(() => {
        // Only clear the slot if it is still ours: a concurrent force-refresh
        // may have replaced it, and clearing that one would strand its joiners.
        if (this.sessionInFlight === inFlight) {
          this.sessionInFlight = null;
        }
      });

    this.sessionInFlight = inFlight;
    return inFlight;
  }

  /**
   * How long the given result may be reused.
   *
   * A positive result additionally never outlives the session's own
   * `expires_at`, so we cannot serve a session we already know has lapsed.
   * A negative result gets a much shorter window so that a sign-in completing
   * in another part of the app is picked up promptly even if some code path
   * forgets to call `invalidateSession()`.
   */
  private sessionCacheDeadline(session: KratosSession | null): number {
    const now = Date.now();
    if (!session) return now + SESSION_NEGATIVE_TTL_MS;

    let deadline = now + SESSION_TTL_MS;
    const expiresAt = Date.parse(session.expires_at ?? "");
    if (Number.isFinite(expiresAt)) {
      deadline = Math.min(deadline, expiresAt);
    }
    // Never cache into the past — an already-expired session must re-fetch.
    return Math.max(deadline, now);
  }

  /** The uncached round-trip. Everything else goes through `getSession()`. */
  private async fetchSession(): Promise<KratosSession | null> {
    try {
      const response = await this.client.get("/sessions/whoami");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      if (axiosError.response?.status === 401) {
        console.log("ℹ️  No active session (401)");
        return null;
      }
      console.error("❌ Error getting session:", error);
      throw error;
    }
  }

  /**
   * Rewrite a flow's `ui.action` onto the origin this app actually reaches
   * Kratos through.
   *
   * Kratos builds `ui.action` from its own `serve.public.base_url`
   * (`https://auth.<domain>/…`), but the browser never talks to that host — it
   * goes through the `/kratos` proxy on this app's API origin, which is what
   * `configureKratos({ publicUrl })` names. That mismatch is invisible for
   * every XHR-submitted flow, because those post to a path we build ourselves.
   * It only bites the one flow that must be submitted as a REAL form
   * navigation — social sign-in, which has to leave the SPA for the provider.
   */
  buildFlowSubmitUrl(action: string): string {
    const target = new URL(action, globalThis.location.origin);
    return `${getKratosConfig().publicUrl}${target.pathname}${target.search}`;
  }

  /**
   * Initialize a login flow
   */
  async initLoginFlow(refresh = false, returnTo?: string): Promise<KratosFlow> {
    const params = new URLSearchParams();
    if (refresh) params.append("refresh", "true");
    if (returnTo) params.append("return_to", returnTo);

    const response = await this.client.get(
      `/self-service/login/browser?${params.toString()}`
    );

    console.log("🔐 Login flow initialized:", {
      flowId: response.data.id,
      refresh,
      setCookieHeaders: response.headers["set-cookie"],
      allHeaders: response.headers,
      hasCsrfToken: response.data.ui.nodes.some(
        (n: KratosFlowNode) => n.attributes?.name === "csrf_token"
      ),
    });

    console.log("🍪 Cookies in document after flow init:", document.cookie);

    return response.data;
  }

  /**
   * Initialize an AAL2 upgrade flow
   */
  async initAal2UpgradeFlow(returnTo?: string): Promise<KratosFlow> {
    const params = new URLSearchParams();
    params.append("aal", "aal2");
    params.append("refresh", "true");
    if (returnTo) params.append("return_to", returnTo);

    const response = await this.client.get(
      `/self-service/login/browser?${params.toString()}`
    );

    console.log("🔐 AAL2 upgrade flow initialized:", {
      flowId: response.data.id,
      aal: "aal2",
      refresh: true,
      nodes: response.data.ui.nodes.map((n: KratosFlowNode) => ({
        group: n.group,
        type: n.type,
        name: n.attributes?.name,
      })),
      messages: response.data.ui.messages,
    });

    return response.data;
  }

  /**
   * Submit login flow with type-safe method-specific data
   */
  async submitLoginFlow(
    flowId: string,
    data: LoginFlowData
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/login?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a registration flow
   */
  async initRegistrationFlow(returnTo?: string): Promise<KratosFlow> {
    const params = new URLSearchParams();
    if (returnTo) params.append("return_to", returnTo);

    const response = await this.client.get(
      `/self-service/registration/browser?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Submit registration flow
   */
  async submitRegistrationFlow(
    flowId: string,
    data: {
      traits: { email: string; name?: string };
      password: string;
      method: string;
      csrf_token?: string;
    }
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/registration?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Activate a recovery link (token-based).
   * Uses fetch with redirect:"manual" — axios maxRedirects:0 only works in Node.js,
   * browsers always follow redirects regardless. The 303 from Kratos is the success signal.
   */
  async activateRecoveryLink(flowId: string, token: string): Promise<void> {
    const url = `${this.client.defaults.baseURL}/self-service/recovery?flow=${flowId}&token=${token}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "manual",
      credentials: "include",
    });

    // status 0 = opaque redirect, 303 = redirect — both mean Kratos accepted the token
    if (resp.status !== 0 && resp.status !== 303 && !resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: { message?: string } }).error?.message ||
          "Invalid or expired recovery token"
      );
    }

    // A session cookie now exists, but this request went out via `fetch` rather
    // than `this.client`, so the constructor's mutation interceptor never saw
    // it. Without this line the cached "signed out" answer would survive until
    // the 2s negative TTL lapses. The TTL bounds the damage; it should not be
    // what we rely on.
    this.invalidateSession();

    console.log("✅ Recovery link activated. Session cookie is now set.");
  }

  /**
   * Set a new password using an active settings flow (post-recovery).
   */
  async setPasswordAfterRecovery(
    flowId: string,
    password: string,
    csrfToken: string
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/settings?flow=${flowId}`,
      { method: "password", password, csrf_token: csrfToken }
    );
    return response.data;
  }

  /**
   * Initialize a recovery (password reset) flow
   */
  async initRecoveryFlow(): Promise<KratosFlow> {
    const response = await this.client.get("/self-service/recovery/browser");
    return response.data;
  }

  /**
   * Submit recovery flow
   * TODO : to refactor to split
   */
  async submitRecoveryFlow(
    flowId: string,
    data: {
      email?: string;
      code?: string;
      token?: string;
      method: string;
      csrf_token?: string;
    }
  ): Promise<KratosFlowResponse> {
    // Token/code submissions trigger a 303 redirect that axios follows in the browser,
    // landing on a URL without the /kratos prefix and causing a 404.
    // Use fetch with redirect:"manual" to stop at the redirect — the session cookie
    // is set by the response headers before the redirect is followed.
    if (data.token || data.code) {
      const url = `${this.client.defaults.baseURL}/self-service/recovery?flow=${flowId}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        redirect: "manual",
        credentials: "include",
      });
      // 0 = opaque redirect, 303 = redirect — both mean success
      if (resp.status !== 0 && resp.status !== 303 && !resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        // Shape as axios-like error so extractKratosError can parse it
        const e = Object.assign(new Error("Recovery failed"), {
          isAxiosError: true,
          response: {
            status: resp.status,
            statusText: resp.statusText,
            data: errorData,
          },
        });
        throw e;
      }
      // Same reason as activateRecoveryLink: this is a raw `fetch`, so the
      // interceptor on `this.client` does not fire, and Kratos has just set a
      // session cookie in the response headers.
      this.invalidateSession();
      return {};
    }

    const response = await this.client.post(
      `/self-service/recovery?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a settings flow (for profile updates)
   */
  async initSettingsFlow(): Promise<KratosFlow> {
    const response = await this.client.get("/self-service/settings/browser");
    return response.data;
  }

  /**
   * Submit settings flow
   */
  async submitSettingsFlow(
    flowId: string,
    data: Record<string, unknown>
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/settings?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a verification flow
   */
  async initVerificationFlow(): Promise<KratosFlow> {
    const response = await this.client.get(
      "/self-service/verification/browser"
    );
    return response.data;
  }

  /**
   * Submit verification flow
   */
  async submitVerificationFlow(
    flowId: string,
    data: { email: string; method: string }
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/verification?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      const response = await this.client.get("/self-service/logout/browser");
      const logoutToken = response.data.logout_token;
      await this.client.get(`/self-service/logout?token=${logoutToken}`);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      // Explicit because logout is a GET, so the mutation interceptor in the
      // constructor does not fire — and because it must also drop the cache
      // when the call FAILS: a half-completed logout that left the cookie dead
      // must not keep serving a positive session from memory.
      this.invalidateSession();
    }
  }

  /**
   * Get flow by ID (useful for handling redirects)
   */
  async getFlow(flowType: KratosFlowType, flowId: string): Promise<KratosFlow> {
    const response = await this.client.get(
      `/self-service/${flowType}/flows?id=${flowId}`
    );
    return response.data;
  }

  /**
   * Resolve the error behind a `?id=` on the error UI URL.
   *
   * Kratos does not put the reason in the redirect — it stores the error and
   * sends only its id, so the page it lands on has to ask for the detail. A
   * flow that dies before it can render (expired, provider refused, identity
   * schema rejected the mapped traits) ends up here and nowhere else.
   */
  async getFlowError(id: string): Promise<KratosFlowError> {
    const response = await this.client.get(`/self-service/errors?id=${id}`);
    return response.data;
  }

  /**
   * Get MFA status for current user
   */
  async getMFAStatus(): Promise<{
    totp_enabled: boolean;
    webauthn_enabled: boolean;
    recovery_codes_set: boolean;
    available_methods: string[];
    aal: string;
  }> {
    // Force-refresh rather than issuing a second, separately-uncached whoami:
    // MFA status must reflect an enrolment that just completed, and routing it
    // through getSession() means this call primes the shared cache instead of
    // being a parallel source of the fan-out that cache exists to remove.
    //
    // `credentials` is only present on whoami when Kratos is configured to
    // return it and is absent from the KratosSession contract, so this stays
    // loosely typed exactly as it was when it read `response.data`.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const session = (await this.getSession({ force: true })) as any;

    const status = {
      totp_enabled: false,
      webauthn_enabled: false,
      recovery_codes_set: false,
      available_methods: ["totp", "webauthn", "lookup_secret"],
      // A null session (401) is now reachable here where `response.data` would
      // previously have thrown from the interceptor. Degrade to aal1 rather
      // than blowing up the settings page.
      aal: session?.authenticator_assurance_level || "aal1",
    };

    if (session?.identity?.credentials?.totp?.config) {
      status.totp_enabled = true;
    }

    if (
      session?.identity?.credentials?.webauthn?.config?.credentials?.length > 0
    ) {
      status.webauthn_enabled = true;
    }

    if (session?.identity?.credentials?.lookup_secret?.config) {
      status.recovery_codes_set = true;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return status;
  }

  /**
   * Submit settings flow with method-specific data
   */
  async submitSettingsMethod(
    flowId: string,
    method: string,
    data: Record<string, unknown>
  ): Promise<KratosFlowResponse> {
    const payload: Record<string, unknown> = { method };

    Object.keys(data).forEach((key) => {
      payload[key] = data[key];
    });

    console.log("📤 Submitting settings method:", {
      flowId,
      method,
      payload,
    });

    const response = await this.client.post(
      `/self-service/settings?flow=${flowId}`,
      payload
    );
    return response.data;
  }
}

let _instance: KratosService | null = null;

/**
 * Lazily-initialized singleton.
 * Defers construction until first access so that `configureKratos()` has time to run.
 */
export const kratosService: KratosService = new Proxy({} as KratosService, {
  get(_target, prop) {
    if (!_instance) {
      _instance = new KratosService();
    }
    const value = Reflect.get(_instance, prop, _instance);
    return typeof value === "function" ? value.bind(_instance) : value;
  },
});
