# Frontend Authentication & Authorization

## Overview

The frontend uses **Ory Kratos** for authentication and session management, with a shared library (`core-fe-lib`) providing reusable auth components, composables, and stores. The architecture supports multi-tenant access, role-based authorization, and multi-factor authentication (MFA/AAL2).

## Development

**_Default kratos configuration in core-be-lib uses domain_**:

```
ctoup.localhost
```

## Architecture

### Components

- **Ory Kratos**: Identity and session management (self-hosted)
- **core-fe-lib**: Shared authentication library
- **Axios Interceptors**: Automatic session handling and AAL2 enforcement
- **Pinia Stores**: User and AAL2 state management
- **Router Guards**: Route-level authorization

### Multi-Subdomain Setup

The platform uses subdomain-based multi-tenancy:

- **App subdomains**: `corpb.ctoup.localhost`, `tenant1.ctoup.localhost`
- **Auth subdomain**: `auth.ctoup.localhost` (Kratos public API)

All kratos requests are proxied to auth. subdomain
WebAuthn credentials are bound to the auth subdomain to ensure same-origin policy compliance across all tenants.

## Configuration

### 1. Kratos Proxy (Development)

Vite proxies both Kratos and backend API through the dev server to avoid CORS issues:

```typescript
// vite.config.ts
server: {
  proxy: {
    // Proxy Kratos API through Vite dev server
    "/kratos": {
      target: "http://localhost:4433", // Internal Kratos port
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/kratos/, ""),
      configure: (proxy, _options) => {
        proxy.on("proxyReq", (proxyReq, req, res) => {
          // Tell Kratos it's being accessed via the auth domain
          proxyReq.setHeader("Host", "auth.ctoup.localhost");
          proxyReq.setHeader("Origin", "http://auth.ctoup.localhost");
          proxyReq.setHeader("X-Forwarded-Host", "auth.ctoup.localhost");
        });
        proxy.on("proxyRes", (proxyRes, req, res) => {
          // Normalize cookies for cross-subdomain access
          const sc = proxyRes.headers["set-cookie"];
          if (sc) {
            proxyRes.headers["set-cookie"] = sc.map((c) =>
              c.replace(/Domain=[^;]+/gi, "Domain=.ctoup.localhost")
            );
          }
        });
      },
    },
    // Proxy backend API through Vite dev server
    "/public-api": {
      target: "http://localhost:7001",
      changeOrigin: true,
      cookieDomainRewrite: false,
      configure: (proxy, _options) => {
        proxy.on("error", (err, _req, _res) => {
          console.log("Backend API proxy error", err);
        });
        proxy.on("proxyReq", (proxyReq, req, _res) => {
          // Forward headers for CORS
          let origin = req.headers.origin || req.headers.Origin;
          if (!origin && req.headers.referer) {
            try {
              const refererUrl = new URL(req.headers.referer);
              origin = refererUrl.origin;
            } catch {}
          }
          if (origin) {
            proxyReq.setHeader("X-Forwarded-Origin", origin);
          }
        });
      },
    },
  },
}
```

### 2. Library Initialization

Initialize `core-fe-lib` and axios before any API calls. This must be called once at app startup, before creating the Vue app:

```typescript
// src/boot/kratos.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { OpenAPI } from "core-fe-lib/openapi/core";
import {
  configureKratos,
  kratosService,
  isAal2Required,
  handleAal2Error,
  useAal2Store,
} from "core-fe-lib/authentication/vue";
import { useRoute } from "vue-router";

export function initializeAuth() {
  // Set base URL from environment variable
  // If empty, use relative URLs (for Vite proxy in development)
  const baseURL = import.meta.env.VITE_HTTP_API || "";
  const kratosPublicUrl = baseURL + "/kratos";

  // Configure the shared Kratos library
  configureKratos({ publicUrl: kratosPublicUrl });

  // Set axios defaults
  axios.defaults.baseURL = baseURL;
  axios.defaults.withCredentials = true;

  // Configure OpenAPI client
  OpenAPI.BASE = ""; // axios will handle baseURL
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.TOKEN = async () => {
    try {
      const session = await kratosService.getSession();
      return session?.id || "";
    } catch {
      return ""; // Return empty for public endpoints
    }
  };

  // Setup axios interceptors (see below)
}
```

```typescript
// src/main.ts
import { createApp } from "vue";
import { initializeAuth } from "@/boot/kratos-api";

initializeAuth(); // MUST be called before creating the app
const app = createApp(App);
// ... rest of setup
```

## Session Management

### Axios Request Interceptor

Automatically adds session token and tenant context to API requests (excludes Kratos self-service flows):

```typescript
// Inside initializeAuth()
axios.interceptors.request.use(
  async (config) => {
    // Skip modifying Kratos self-service flows (they have their own CSRF tokens)
    if (
      config.url?.startsWith(kratosPublicUrl) ||
      config.url?.includes("/self-service/")
    ) {
      return config; // Don't modify Kratos flow requests
    }

    // Extract session cookie and send as header for backend API
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find((c) =>
      c.trim().startsWith("ory_kratos_session=")
    );
    if (sessionCookie) {
      const sessionToken = sessionCookie.split("=")[1].trim();
      config.headers["X-Session-Token"] = sessionToken;
    }

    try {
      // Get current Kratos session for tenant context
      const session = await kratosService.getSession();
      if (session?.active) {
        // Add tenant context from session metadata if available
        const tenantID = session.identity.metadata_public?.tenant_id;
        if (tenantID) {
          config.headers["X-Tenant-ID"] = tenantID;
        }
      }
    } catch {
      // Silently ignore session errors during recovery/registration flows
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### Axios Response Interceptor

Handles AAL2 (MFA) challenges, session expiration, and auth flow protection:

```typescript
// Inside initializeAuth()
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _aal2Retry?: boolean;
    };

    // Handle AAL2 errors first (MFA required)
    if (isAal2Required(error)) {
      console.log("🔐 AAL2 required error detected in interceptor");
      const aal2Store = useAal2Store();
      return handleAal2Error(error, originalRequest, aal2Store);
    }

    // Handle 401 (session expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't redirect during auth flows (signin, signup, recovery, etc.)
      const currentRoute = useRoute();
      const isAuthFlow = !currentRoute.matched.some(
        (record) => record.meta.requiresAuth
      );

      try {
        // Try to get fresh session
        const session = await kratosService.getSession();

        if (session?.active) {
          // Update session token and retry
          originalRequest.headers["X-Session-Token"] = session.id;

          const tenantID = session.identity.metadata_public?.tenant_id;
          if (tenantID) {
            originalRequest.headers["X-Tenant-ID"] = tenantID;
          }

          return axios(originalRequest);
        } else if (!isAuthFlow) {
          // Session is invalid, redirect to signin (but not during auth flows)
          console.warn("Session expired, redirecting to login");
          globalThis.location.href = "/signin";
        }
      } catch (refreshError) {
        console.error("Session refresh failed:", refreshError);
        if (!isAuthFlow) {
          globalThis.location.href = "/signin";
        }
        throw refreshError;
      }
    }

    throw error;
  }
);
```

## User State Management

### User Store

Stores logged user data and session:

```typescript
// core-fe-lib/stores/user-store.ts
export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as LoggedUser | null,
    session: null as KratosSession | null,
    isLoading: false,
  }),
  getters: {
    isLogged: (state) => state.session?.active ?? false,
    isAdmin: (state) => state.user?.roles?.includes(Role.ADMIN),
    hasPrivilege: (state) => (requiredRole: Role) =>
      hasPrivilege(state.user?.roles ?? [], requiredRole),
  },
  actions: {
    setUser(user: LoggedUser | null) {
      this.user = user;
    },
    setSession(session: KratosSession | null) {
      this.session = session;
    },
  },
});
```

### Updating User State

Use the shared utility to sync user state from Kratos session:

```typescript
import { updateUserFromSession } from "core-fe-lib/authentication";

const session = await kratosService.getSession();
await updateUserFromSession(session);
```

## Authorization

### Router Guards

Route-level authorization checks:

```typescript
// src/router/index.ts
router.beforeEach(async (to, from, next) => {
  await initializeAuth(); // Load session once

  const userStore = useUserStore();

  // Redirect authenticated users from signin
  if (userStore.isLogged && to.path === "/signin") {
    return next("/");
  }

  // Check authentication requirement
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (!requiresAuth) {
    return next();
  }

  if (!userStore.isLogged) {
    return next(`/signin?from=${encodeURIComponent(to.fullPath)}`);
  }

  // Check tenant access (roles)
  if (!userStore.user?.roles?.length) {
    return next("/no-access");
  }

  // Check privilege level
  const requiredPrivilege = to.meta?.requiredPrivilege as Role;
  if (requiredPrivilege && !userStore.hasPrivilege(requiredPrivilege)) {
    return next("/");
  }

  next();
});
```

### Route Meta

Define auth requirements in routes:

```typescript
{
  path: "/admin",
  meta: {
    requiresAuth: true,
    requiredPrivilege: Role.ADMIN,
  },
}
```

## Multi-Factor Authentication (MFA)

### AAL2 (Authenticator Assurance Level 2)

Privileged operations require MFA verification. The system automatically prompts users when AAL2 is required.

#### Flow

1. User performs privileged action (e.g., change password)
2. Backend returns `403` with `session_aal2_required` error
3. Axios interceptor detects AAL2 requirement
4. AAL2 dialog prompts for verification (TOTP/WebAuthn/Recovery Code)
5. User verifies identity
6. Original request retries automatically

#### AAL2 Store

Manages MFA verification state:

```typescript
// core-fe-lib/authentication/stores/aal2-store.ts
export const useAal2Store = defineStore("aal2", () => {
  const state = ref<Aal2VerificationState>({
    show: false,
    flowId: null,
    availableMethods: ["totp", "webauthn", "lookup_secret"],
    selectedMethod: null,
    totpCode: "",
    error: "",
  });

  function triggerVerification(): Promise<boolean> {
    return new Promise((resolve) => {
      verificationResolve = resolve;
      state.value.show = true;
      initializeFlowFn(); // Calls useAal2().promptAal2Verification()
    });
  }

  return { state, triggerVerification, resolveVerification };
});
```

#### AAL2 Composable

Handles verification logic:

```typescript
// core-fe-lib/authentication/composables/useAal2.ts
export function useAal2() {
  const aal2Store = useAal2Store();

  async function promptAal2Verification() {
    const session = await kratosService.getSession();
    const mfaStatus = await MfaService.getMfaStatus();

    // Build available methods
    const availableMethods = [];
    if (mfaStatus.totp_enabled) availableMethods.push("totp");
    if (mfaStatus.webauthn_enabled) availableMethods.push("webauthn");
    if (mfaStatus.recovery_codes_set) availableMethods.push("lookup_secret");

    // Initialize AAL2 upgrade flow
    const flow = await kratosService.initAal2UpgradeFlow();

    aal2Store.updateState({
      flowId: flow.id,
      availableMethods,
      selectedMethod: availableMethods[0],
    });
  }

  async function submitTotpVerification() {
    await kratosService.submitLoginFlow(aal2Store.state.flowId, {
      method: "totp",
      totp_code: aal2Store.state.totpCode,
      csrf_token: aal2Store.state.csrfToken,
    });
    aal2Store.resolveVerification(true);
  }

  return {
    aal2State: aal2Store.state,
    submitTotpVerification,
    submitWebAuthnVerification,
    submitLookupVerification,
  };
}
```

### MFA Setup

Users can enable MFA methods via the `useMfa()` composable:

```typescript
// core-fe-lib/authentication/composables/useMfa.ts
export function useMfa() {
  async function setupTOTP() {
    const flow = await MfaService.initializeSettingsFlow();
    // Extract QR code and secret
    // Show setup dialog
  }

  async function setupWebAuthn() {
    // Redirect to auth subdomain for same-origin WebAuthn ceremony
    const registerUrl = buildWebAuthnRegisterUrl();
    globalThis.location.href = registerUrl;
  }

  async function performWebAuthnRegistration() {
    const flow = await MfaService.initializeSettingsFlow();
    // Extract challenge
    const credential = await navigator.credentials.create({ publicKey });
    // Submit credential to Kratos
    await kratosService.submitSettingsMethod(flow.id, "webauthn", {
      webauthn_register: JSON.stringify(credentialData),
      csrf_token: csrf,
    });
  }

  return {
    setupTOTP,
    setupWebAuthn,
    performWebAuthnRegistration,
    disableTOTP,
    disableWebAuthn,
  };
}
```

### WebAuthn Same-Origin Requirement

WebAuthn credentials are bound to the origin where they're created. To ensure credentials work across all tenant subdomains:

1. **Registration**: Redirect to `auth.ctoup.localhost/register/webauthn`
2. **Verification**: Redirect to `auth.ctoup.localhost/verify/webauthn`

Both pages perform the WebAuthn ceremony on the auth subdomain, then redirect back with `return_to` parameter.

#### URL Builders

```typescript
// core-fe-lib/authentication/utils/auth-domain.ts
export function getAuthOrigin(): string {
  const url = new URL(globalThis.location.href);
  const hostParts = url.hostname.split(".");

  // Extract base domain (e.g., ctoup.localhost)
  let baseDomain = url.hostname;
  if (hostParts.length > 2) {
    baseDomain = hostParts.slice(-2).join(".");
  }

  return `${url.protocol}//auth.${baseDomain}${url.port ? `:${url.port}` : ""}`;
}

export function buildWebAuthnRegisterUrl(returnTo?: string): string {
  const authOrigin = getAuthOrigin();
  const returnUrl = returnTo || globalThis.location.href;
  return `${authOrigin}/register/webauthn?return_to=${encodeURIComponent(returnUrl)}`;
}

export function buildWebAuthnVerifyUrl(returnTo?: string): string {
  const authOrigin = getAuthOrigin();
  const returnUrl = returnTo || globalThis.location.href;
  return `${authOrigin}/verify/webauthn?return_to=${encodeURIComponent(returnUrl)}`;
}
```

## Production Deployment

### Nginx Configuration

Proxy Kratos with CORS and origin validation, and proxy backend API:

```nginx
# Kratos public API
location /kratos/ {
    proxy_pass http://kratos:4433/;

    # Spoof headers so Kratos sees auth subdomain as origin
    proxy_set_header Host auth.yourdomain.com;
    proxy_set_header X-Forwarded-Host auth.yourdomain.com;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Normalize cookies for cross-subdomain access
    proxy_cookie_domain kratos .yourdomain.com;
}

# Backend API
location /api/ {
    proxy_pass http://backend:7001/api/;
    proxy_set_header X-Session-Token $http_x_session_token;
    proxy_set_header X-Tenant-ID $http_x_tenant_id;
}
```

### Environment Variables

```bash
# Frontend
VITE_HTTP_API=https://api.yourdomain.com

# Kratos
SERVE_PUBLIC_BASE_URL=https://auth.yourdomain.com
SERVE_PUBLIC_CORS_ALLOWED_ORIGINS=https://*.yourdomain.com
COOKIES_DOMAIN=.yourdomain.com
```

## Key Concepts

- **Session Cookie**: `ory_kratos_session` cookie set by Kratos, domain `.ctoup.localhost`
- **Session Token**: Extracted from cookie and sent as `X-Session-Token` header to backend
- **Tenant Context**: `X-Tenant-ID` header derived from session metadata
- **AAL1**: Standard authentication (username/password)
- **AAL2**: Enhanced authentication (AAL1 + MFA)
- **Same-Origin Policy**: WebAuthn credentials bound to auth subdomain for cross-tenant compatibility

---

## Next.js (Frontoffice) Implementation Guide

The frontoffice is a Next.js App Router application. The authentication library's framework-agnostic core is ready to use; only the Next.js integration layer needs to be built.

### What's Already Available

Import from `core-fe-lib/authentication` (pure TS, no framework dependency):

- `configureKratos`, `kratosService` — Kratos API calls (session, flows, settings)
- `Aal2Manager` — pure state machine for AAL2 verification flow
- `isAal2Required`, `handleAal2Error`, `getUserFriendlyMessage` — error processing
- `buildWebAuthnRegisterUrl`, `buildWebAuthnVerifyUrl`, `getAuthOrigin` — URL builders
- `extractRecoveryCodes`, `getSecretFromFlow` — flow data extraction
- All Kratos types (`KratosSession`, `Aal2VerificationState`, `IStateStore`, etc.)

### Server vs Client Boundary

The core library uses `globalThis.location`, `sessionStorage`, `document.cookie`, and `navigator.credentials` — all browser APIs. This means:

- **Core functions are client-only** — always use them inside `"use client"` components or in `useEffect`
- **Server-side session checks** should call Kratos directly via `fetch` in middleware or Server Components, forwarding the `Cookie` header from the incoming request
- **`kratosService`** must NOT be called from Server Components or middleware (it relies on browser globals)

### File Structure

```
authentication/
├── index.ts          # core exports (already done)
├── vue.ts            # Vue re-exports (already done)
├── next.ts           # NEW — re-exports core + Next.js-specific
├── core/             # already done, shared
└── next/             # NEW
    ├── auth-provider.tsx       # React Context for session + AAL2 state
    ├── use-kratos-auth.ts      # "use client" hook
    ├── use-aal2.ts             # "use client" hook
    ├── use-mfa.ts              # "use client" hook
    ├── use-tenant.ts           # "use client" hook
    ├── kratos-update-user.ts   # client-side session sync
    └── middleware-helpers.ts   # server-side session validation
```

Entry point:

```typescript
// authentication/next.ts
"use client";
export * from "./index";
export { AuthProvider, useAuth } from "./next/auth-provider";
export { useAal2 } from "./next/use-aal2";
export { useMfa } from "./next/use-mfa";
export { useTenant } from "./next/use-tenant";
export { updateUserFromSession } from "./next/kratos-update-user";

// Server-safe (no "use client" needed by consumers)
export { validateSession } from "./next/middleware-helpers";
```

### Key Patterns

#### 1. Middleware — Server-Side Session Check

Next.js middleware runs on the edge. Call Kratos directly with `fetch`, forwarding cookies:

```typescript
// frontoffice/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const KRATOS_PUBLIC_URL = process.env.KRATOS_PUBLIC_URL!; // e.g. http://kratos:4433

export async function middleware(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";

  const res = await fetch(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
    headers: { cookie },
  });

  if (!res.ok && req.nextUrl.pathname !== "/signin") {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

#### 2. AuthProvider — Client-Side Session Context

Wrap the app in a provider that initializes `kratosService` and exposes session state:

```typescript
// next/auth-provider.tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { configureKratos, kratosService, type KratosSession } from "../index";

interface AuthContextValue {
  session: KratosSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, kratosUrl }: { children: ReactNode; kratosUrl: string }) {
  const [session, setSession] = useState<KratosSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureKratos({ publicUrl: kratosUrl });
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const s = await kratosService.getSession();
      setSession(s);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ session, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

Mount in root layout:

```typescript
// frontoffice/app/layout.tsx
import { AuthProvider } from "core-fe-lib/authentication/next";

export default function RootLayout({ children }) {
  return (
    <AuthProvider kratosUrl={process.env.NEXT_PUBLIC_KRATOS_URL || "/kratos"}>
      {children}
    </AuthProvider>
  );
}
```

#### 3. AAL2 Store → Zustand

Zustand is the recommended state management for the Next.js layer. It mirrors Pinia's simplicity, supports selectors for granular re-renders, and works outside React components (critical for axios interceptors and `Aal2Manager`):

```typescript
// next/aal2-store.ts
import { create } from "zustand";
import type { Aal2VerificationState, IStateStore } from "../core/aal2-manager";

interface Aal2Store extends Aal2VerificationState {
  update: (partial: Partial<Aal2VerificationState>) => void;
  reset: () => void;
}

export const useAal2Store = create<Aal2Store>((set) => ({
  show: false,
  flowId: null,
  availableMethods: [],
  selectedMethod: null,
  totpCode: "",
  error: "",
  update: (partial) => set(partial),
  reset: () => set({ show: false, flowId: null, error: "" }),
}));

// IStateStore adapter — works outside components (interceptors, Aal2Manager)
export const aal2StoreAdapter: IStateStore = {
  getState: () => useAal2Store.getState(),
  setState: (partial) => useAal2Store.getState().update(partial),
};
```

This can be called from axios interceptors without any provider or hook context:

```typescript
// In interceptor setup
import { aal2StoreAdapter } from "core-fe-lib/authentication/next";
handleAal2Error(error, originalRequest, aal2StoreAdapter);
```

#### 4. Hooks — Vue Composable Mapping

| Vue (`vue/`)                 | Next.js (`next/`)                         |
| ---------------------------- | ----------------------------------------- |
| `ref(value)`                 | `useState(value)`                         |
| `onMounted(fn)`              | `useEffect(fn, [])`                       |
| `inject(key)`                | `useContext(SomeContext)`                 |
| `useMfa()` composable        | `useMfa()` hook (`"use client"`)          |
| Pinia store                  | Zustand store                             |
| Vue Router `useRoute()`      | `usePathname()` / `useSearchParams()`     |
| `globalThis.location.href =` | `router.push()` or `window.location.href` |

#### 5. Pending MFA Actions (sessionStorage)

The `sessionStorage` pattern works as-is in Next.js client components. Call `replayPendingMfaAction()` in a `useEffect` on the MFA settings page:

```typescript
// frontoffice/app/settings/security/page.tsx
"use client";
import { useEffect } from "react";
import { useMfa } from "core-fe-lib/authentication/next";

export default function SecuritySettingsPage() {
  const { loadMFAStatus, replayPendingMfaAction, ...mfa } = useMfa();

  useEffect(() => {
    loadMFAStatus().then(() => replayPendingMfaAction());
  }, []);

  // render MFA settings UI...
}
```

#### 6. Axios Interceptors

Configure once in `AuthProvider`'s `useEffect`, or in a dedicated `useAxiosInterceptors()` hook called from the root layout client component. The interceptor logic is identical to the Vue version — the only difference is using `useAuth()` context instead of Pinia for session state, and `useRouter()` for redirects.

### Environment Variables

```bash
# Server-side (middleware, API routes)
KRATOS_PUBLIC_URL=http://kratos:4433

# Client-side (browser)
NEXT_PUBLIC_KRATOS_URL=/kratos   # proxied via next.config.js rewrites
```

### Next.js Rewrites (Dev Proxy)

Replace Vite proxy with Next.js rewrites:

```typescript
// frontoffice/next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/kratos/:path*",
        destination: "http://localhost:4433/:path*",
      },
      {
        source: "/public-api/:path*",
        destination: "http://localhost:7001/public-api/:path*",
      },
    ];
  },
};
```

### Consumers Import From

```typescript
// Next.js frontoffice
import {
  configureKratos,
  useMfa,
  useAuth,
} from "core-fe-lib/authentication/next";

// Vue backoffice (unchanged)
import { configureKratos, useMfa } from "core-fe-lib/authentication/vue";

// Framework-agnostic (core only)
import { configureKratos, kratosService } from "core-fe-lib/authentication";
```
