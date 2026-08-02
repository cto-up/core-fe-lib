/**
 * Vue composable for Kratos authentication
 * Calls kratosService directly — router/i18n/notifications are
 * inherently Vue concerns, no need to abstract them.
 */

import { computed, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { notificationServiceKey } from "../../plugins/injection-keys";
import { useUserStore } from "core-fe-lib/stores/user-store";
import { updateUserFromSession } from "./kratos-update-user";
import {
  kratosService,
  type KratosSession,
  type KratosFlow,
  type KratosFlowNode,
  type PasswordLoginFlowData,
} from "../core/kratos-service";
import {
  isKratosErrorId,
  KratosErrorIds,
} from "../core/kratos-error-processor";
import type { AxiosError } from "axios";

/** Kratos identifiers are case-insensitive; compare them that way. */
function sameIdentifier(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export const useKratosAuth = () => {
  const router = useRouter();
  const route = useRoute();
  const { t, te } = useI18n();
  const notifications = inject(notificationServiceKey);

  // Consumer apps may ship their own `auth.*` dictionary rather than
  // core-fe-lib's. Keys added after they forked would render as a raw key path,
  // so anything introduced here must carry a literal fallback.
  const tf = (key: string, fallback: string): string =>
    te(key) ? t(key) : fallback;
  const userStore = useUserStore();

  if (!notifications) {
    throw new Error(
      "NotificationService not provided. Ensure the UI services are provided at the app level."
    );
  }

  const session = computed(() => userStore.session);
  const isLoading = computed(() => userStore.isLoading);

  async function getCurrentSession(): Promise<KratosSession | null> {
    try {
      userStore.setIsLoading(true);
      const currentSession = await kratosService.getSession();
      await updateUserFromSession(currentSession);
      return currentSession;
    } catch (error) {
      console.error("Error getting session:", error);
      await updateUserFromSession(null);
      return null;
    } finally {
      userStore.setIsLoading(false);
    }
  }

  function redirectAfterLogin(returnTo?: string): void {
    const target = returnTo || "/";
    if (target.startsWith("http")) {
      globalThis.location.href = target;
    } else {
      void router.push(target);
    }
  }

  /**
   * Kratos refuses to mint a login flow while a session cookie is still live —
   * it answers 400 `session_already_available`. That is not an authentication
   * failure, so it must never surface as one:
   *
   *  - same identity  → the sign-in is a no-op that already succeeded; adopt the
   *    session and go where the user was headed.
   *  - other identity → the user means "switch account", which requires a real
   *    logout first. `refresh=true` is the wrong tool: it re-authenticates the
   *    SAME identity and would fail with `security_identity_mismatch`.
   *
   * Returns true when the sign-in is already complete and the caller must stop.
   */
  async function resolveExistingSession(
    email: string,
    returnTo?: string
  ): Promise<boolean> {
    const current = await kratosService
      .getSession({ force: true })
      .catch(() => null);

    if (
      current?.active &&
      sameIdentifier(current.identity?.traits?.email, email)
    ) {
      await updateUserFromSession(current);
      notifications.info(
        tf("auth.alreadySignedIn.toastTitle", "Already signed in"),
        tf(
          "auth.alreadySignedIn.toastDescription",
          "We've taken you back to where you left off."
        )
      );
      redirectAfterLogin(returnTo);
      return true;
    }

    await clearSession();
    return false;
  }

  async function signMeIn(email: string, password: string): Promise<void> {
    try {
      userStore.setIsLoading(true);

      const returnTo = route.query["from"] as string;

      let flow: KratosFlow;
      try {
        flow = await kratosService.initLoginFlow(false);
      } catch (error: unknown) {
        if (!isKratosErrorId(error, KratosErrorIds.SESSION_ALREADY_AVAILABLE)) {
          throw error;
        }
        if (await resolveExistingSession(email, returnTo)) return;
        flow = await kratosService.initLoginFlow(false);
      }

      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");

      if (!csrfToken) {
        throw new Error("CSRF token not found in login flow");
      }

      const loginData: PasswordLoginFlowData = {
        method: "password",
        csrf_token: csrfToken,
        identifier: email,
        password: password,
      };

      const loginResponse = await kratosService.submitLoginFlow(
        flow.id,
        loginData
      );

      if (loginResponse && "active" in loginResponse && loginResponse.active) {
        await updateUserFromSession(loginResponse as KratosSession);
      } else {
        await getCurrentSession();
      }

      redirectAfterLogin(returnTo);

      notifications.success(t("auth.success"), t("auth.loginSuccess"));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        ui?: { messages?: Array<{ text: string }> };
        error?: { message?: string };
      }>;

      const errorMessage =
        axiosError.response?.data?.ui?.messages?.[0]?.text ||
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        t("auth.loginError");

      notifications.error(t("auth.error"), errorMessage);
      throw error;
    } finally {
      userStore.setIsLoading(false);
    }
  }

  async function signMeUp(
    email: string,
    password: string,
    name?: string,
    tenantSubdomain?: string
  ): Promise<void> {
    try {
      userStore.setIsLoading(true);

      if (tenantSubdomain) {
        sessionStorage.setItem("pending_tenant", tenantSubdomain);
      }

      const flow = await kratosService.initRegistrationFlow();

      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");

      if (!csrfToken) {
        throw new Error("CSRF token not found in registration flow");
      }

      const traits: { email: string; name?: string; subdomain?: string } = {
        email,
        name: name || "",
      };

      if (tenantSubdomain) {
        traits.subdomain = tenantSubdomain;
      }

      await kratosService.submitRegistrationFlow(flow.id, {
        traits,
        password,
        method: "password",
        csrf_token: csrfToken,
      });

      await getCurrentSession();
      sessionStorage.removeItem("pending_tenant");
      router.push("/user/me/profile");

      notifications.success(t("auth.success"), t("auth.registrationSuccess"));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        ui?: { messages?: Array<{ text: string }> };
        error?: { message?: string };
      }>;

      const errorMessage =
        axiosError.response?.data?.ui?.messages?.[0]?.text ||
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        t("auth.registrationError");

      notifications.error(t("auth.error"), errorMessage);
      throw error;
    } finally {
      userStore.setIsLoading(false);
    }
  }

  /**
   * Drop the session without navigating or notifying — the "sign in as a
   * different user" path, where the user stays on the sign-in form.
   */
  async function clearSession(): Promise<void> {
    try {
      await kratosService.logout();
    } catch (error) {
      // Best-effort: the cookie may already be dead server-side. `logout()`
      // invalidates the session cache either way, so the local store is still
      // the thing that has to be corrected.
      console.warn("Logout failed while switching account:", error);
    }
    await updateUserFromSession(null);
  }

  async function signMeOut(
    redirectQuery?: Record<string, string>
  ): Promise<void> {
    try {
      userStore.setIsLoading(true);
      await kratosService.logout();
      await updateUserFromSession(null);
      void router.push(
        redirectQuery
          ? { name: "signin", query: redirectQuery }
          : { name: "home" }
      );
      notifications.success(t("auth.success"), t("auth.logoutSuccess"));
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      notifications.error(
        t("auth.error"),
        axiosError.message || t("auth.logoutError")
      );
    } finally {
      userStore.setIsLoading(false);
    }
  }

  async function requestPasswordReset(email: string): Promise<void> {
    try {
      userStore.setIsLoading(true);

      const flow = await kratosService.initRecoveryFlow();

      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");

      if (!csrfToken) {
        throw new Error("CSRF token not found in recovery flow");
      }

      await kratosService.submitRecoveryFlow(flow.id, {
        email,
        method: "link",
        csrf_token: csrfToken,
      });

      notifications.success(
        t("auth.success"),
        t("auth.passwordResetEmailSent")
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      notifications.error(
        t("auth.error"),
        axiosError.message || t("auth.passwordResetError")
      );
      throw error;
    } finally {
      userStore.setIsLoading(false);
    }
  }

  async function getSessionToken(): Promise<string | null> {
    try {
      const currentSession = await kratosService.getSession();
      return currentSession?.id || null;
    } catch (error) {
      console.error("Error getting session token:", error);
      return null;
    }
  }

  return {
    session,
    isLoading,
    getCurrentSession,
    signMeIn,
    signMeUp,
    signMeOut,
    clearSession,
    requestPasswordReset,
    getSessionToken,
  };
};
