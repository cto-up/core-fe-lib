/**
 * Authentication Boot
 *
 * Single entry point for all auth-related setup:
 * - Configures the shared Kratos library (core-fe-lib)
 * - Sets up axios defaults and interceptors for session handling
 * - Configures OpenAPI client credentials
 * - Handles AAL2 (MFA) error interception
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { OpenAPI } from "../../openapi/core";
import {
  configureKratos,
  kratosService,
  isAal2Required,
  isSessionRefreshRequired,
  handleAal2Error,
  useAal2Store,
} from "../../authentication/vue";
import { useRoute } from "vue-router";

export interface InitializeAuthOptions {
  /** Path the user is redirected to on session expiry. Defaults to `/signin`. */
  signinPath?: string;
}

/**
 * Initialize all authentication: shared Kratos config + axios/OpenAPI setup.
 * Must be called once at app startup before any API calls.
 */
export function initializeAuth(options: InitializeAuthOptions = {}) {
  const signinPath = options.signinPath ?? "/signin";
  // Set base URL from environment variable
  // If empty, use relative URLs (for Vite proxy in development)
  const baseURL = import.meta.env.VITE_HTTP_API || "";

  // Derive Kratos public URL from the same base
  const kratosPublicUrl = baseURL + "/kratos";

  // Configure the shared Kratos library
  configureKratos({ publicUrl: kratosPublicUrl });

  // Set axios baseURL
  axios.defaults.baseURL = baseURL;

  // Enable credentials for session cookies
  axios.defaults.withCredentials = true;

  // Set OpenAPI BASE to empty since axios will handle the baseURL
  OpenAPI.BASE = "";

  // Enable credentials for OpenAPI client
  OpenAPI.WITH_CREDENTIALS = true;

  // Request interceptor - Add session token and tenant context
  axios.interceptors.request.use(
    async (config) => {
      // Skip adding session token for Kratos self-service flows
      // These flows have their own CSRF tokens
      if (
        config.url?.startsWith(kratosPublicUrl) ||
        config.url?.includes("/self-service/")
      ) {
        return config; // ✅ Don't modify Kratos flow requests
      }

      // Extract session cookie value and send as header for backend
      // The backend's Kratos client needs this to verify the session
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

  // Response interceptor for AAL2 handling and 401 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _aal2Retry?: boolean;
      };

      // Handle AAL2 errors first (before 401 handling)
      if (isAal2Required(error)) {
        console.log("🔐 AAL2 required error detected in interceptor");
        const aal2Store = useAal2Store();
        return handleAal2Error(error, originalRequest, aal2Store);
      }

      // Handle session refresh required (re-authentication needed)
      if (isSessionRefreshRequired(error)) {
        console.log("🔄 Session refresh required, logging out and redirecting");
        const params = new URLSearchParams(globalThis.location.search);
        const returnTo = params.get("return_to") ?? globalThis.location.href;
        try {
          await kratosService.logout();
        } catch {
          // best-effort logout — proceed to redirect regardless
        }
        const loginUrl = new URL(
          `${kratosPublicUrl}/self-service/login/browser`
        );
        loginUrl.searchParams.set("refresh", "true");
        loginUrl.searchParams.set("return_to", returnTo);
        globalThis.location.href = loginUrl.toString();
        return Promise.reject(error);
      }

      // If 401 and not already retried, session might be expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Don't redirect to signin for routes that don't require authentication
        const currentRoute = useRoute();
        const isAuthFlow = !currentRoute.matched.some(
          (record) => record.meta.requiresAuth
        );

        try {
          // Try to get fresh session
          const session = await kratosService.getSession();

          if (session?.active) {
            // Update session token and tenant context
            originalRequest.headers["X-Session-Token"] = session.id;

            const tenantID = session.identity.metadata_public?.tenant_id;
            if (tenantID) {
              originalRequest.headers["X-Tenant-ID"] = tenantID;
            }

            return axios(originalRequest);
          } else if (!isAuthFlow) {
            // Session is invalid, redirect to login (but not during auth flows)
            console.warn("Session expired, redirecting to login");
            globalThis.location.href = signinPath;
          }
        } catch (refreshError) {
          console.error("Session refresh failed:", refreshError);
          if (!isAuthFlow) {
            // Redirect to login (but not during auth flows)
            globalThis.location.href = signinPath;
          }
          throw refreshError instanceof Error
            ? refreshError
            : new Error(JSON.stringify(refreshError));
        }
      }
      throw error instanceof Error ? error : new Error(JSON.stringify(error));
    }
  );

  // Attach interceptor to the Kratos service's internal axios client so that
  // self-service flow errors (e.g. session_refresh_required on settings/webauthn)
  // are handled — they bypass the global axios instance entirely.
  kratosService.addResponseInterceptor(
    (response) => response,
    async (error: unknown) => {
      if (isSessionRefreshRequired(error)) {
        console.log(
          "🔄 [Kratos client] Session refresh required on self-service flow"
        );
        const aal2Store = useAal2Store();
        aal2Store.updateState({ show: true, sessionRefreshRequired: true });
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  // Update OpenAPI TOKEN resolver
  OpenAPI.TOKEN = async () => {
    try {
      const session = await kratosService.getSession();
      return session?.id || "";
    } catch {
      // Return empty string if no session - this is normal for public endpoints
      return "";
    }
  };
}
