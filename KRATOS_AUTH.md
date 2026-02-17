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

WebAuthn credentials are bound to the auth subdomain to ensure same-origin policy compliance across all tenants.

## Configuration

### 1. Kratos Proxy (Development)

Vite proxies Kratos API to avoid CORS issues:

```typescript
// vite.config.ts
server: {
  proxy: {
    "/kratos": {
      target: "http://localhost:4433",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/kratos/, ""),
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          // Normalize headers for Kratos
          proxyReq.setHeader("Host", "auth.ctoup.localhost");
          proxyReq.setHeader("Origin", "http://auth.ctoup.localhost");
          proxyReq.setHeader("X-Forwarded-Host", "auth.ctoup.localhost");
        });
        proxy.on("proxyRes", (proxyRes) => {
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
  },
}
```

### 2. Library Initialization

Initialize `core-fe-lib` before any API calls:

```typescript
// src/boot/kratos-api.ts
import { configureKratos } from "core-fe-lib/authentication";

export function initializeAuth() {
  const baseURL = import.meta.env.VITE_HTTP_API || "";
  const kratosPublicUrl = baseURL + "/kratos";

  // Configure shared library
  configureKratos({ publicUrl: kratosPublicUrl });

  // Setup axios defaults
  axios.defaults.baseURL = baseURL;
  axios.defaults.withCredentials = true;

  // Setup interceptors (see below)
}
```

```typescript
// src/main.ts
import { initializeAuth } from "@/boot/kratos-api";

initializeAuth(); // MUST be called before createApp
```

## Session Management

### Axios Request Interceptor

Automatically adds session token and tenant context to API requests:

```typescript
axios.interceptors.request.use(async (config) => {
  // Skip Kratos self-service flows
  if (config.url?.includes("/self-service/")) {
    return config;
  }

  // Extract session cookie and send as header
  const sessionCookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("ory_kratos_session="));

  if (sessionCookie) {
    const sessionToken = sessionCookie.split("=")[1].trim();
    config.headers["X-Session-Token"] = sessionToken;
  }

  // Add tenant context from session
  const session = await kratosService.getSession();
  if (session?.active) {
    const tenantID = session.identity.metadata_public?.tenant_id;
    if (tenantID) {
      config.headers["X-Tenant-ID"] = tenantID;
    }
  }

  return config;
});
```

### Axios Response Interceptor

Handles AAL2 (MFA) challenges and session expiration:

```typescript
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle AAL2 errors (MFA required)
    if (isAal2Required(error)) {
      return handleAal2Error(error, originalRequest);
    }

    // Handle 401 (session expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const session = await kratosService.getSession();
      if (session?.active) {
        // Retry with fresh session
        return axios(originalRequest);
      } else {
        // Redirect to signin
        globalThis.location.href = "/signin";
      }
    }

    throw error;
  },
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

Proxy Kratos and normalize cookies:

```nginx
# Kratos public API
location /kratos/ {
    proxy_pass http://kratos:4433/;
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
