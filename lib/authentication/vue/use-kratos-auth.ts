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

export interface SignInWithProviderOptions {
  /** Where Kratos returns the browser after the round trip. */
  returnTo?: string;
  /** A flow Kratos handed us via `?flow=` — submit it rather than replacing it. */
  flow?: KratosFlow | null;
  /**
   * OAuth `prompt`, passed through to the provider.
   *
   * Signing out of this app does not sign the user out of the provider, so by
   * default the next click round-trips through a live provider session and
   * comes straight back — correct, but it reads as "sign-out did nothing".
   * `select_account` makes the provider show its account chooser every time,
   * at the cost of one click per sign-in. `login` forces full
   * re-authentication.
   */
  prompt?: string;
}

/** POST a set of fields as a top-level navigation, the way a `<form>` would. */
function submitFormNavigation(
  action: string,
  fields: Record<string, string>
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
}

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

  /**
   * `existingFlow` — a flow Kratos itself handed us by redirecting to the login
   * UI with `?flow=`. It MUST be submitted rather than replaced: in the
   * account-linking case (a social sign-in whose email already belongs to a
   * password account) that flow carries the pending provider credential, and
   * completing it is what links the two. Minting a fresh flow instead logs the
   * user in and silently drops the link, so the next Google click hits the very
   * same wall.
   */
  async function signMeIn(
    email: string,
    password: string,
    existingFlow?: KratosFlow | null
  ): Promise<void> {
    try {
      userStore.setIsLoading(true);

      const returnTo = route.query["from"] as string;

      let flow: KratosFlow;
      if (existingFlow) {
        flow = existingFlow;
      } else {
        try {
          flow = await kratosService.initLoginFlow(false);
        } catch (error: unknown) {
          if (
            !isKratosErrorId(error, KratosErrorIds.SESSION_ALREADY_AVAILABLE)
          ) {
            throw error;
          }
          if (await resolveExistingSession(email, returnTo)) return;
          flow = await kratosService.initLoginFlow(false);
        }
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

  /**
   * Hand the browser over to a social provider (ADR 039).
   *
   * This must be a real form navigation, not an XHR: the flow ends at Google's
   * consent screen, and Kratos answers the submission with a 303 the browser
   * has to follow at top level. Submitting it through axios would either
   * surface as an opaque CORS failure or, with `Accept: application/json`, as a
   * 422 whose body we would then have to redirect on by hand — the same
   * navigation, one indirection later, with the CSRF cookie no longer
   * guaranteed to be first-party.
   *
   * `returnTo` is registered with Kratos at flow-init time and MUST be listed
   * in `selfservice.allowed_return_urls`, or Kratos silently substitutes the
   * default return URL and the user lands on the wrong host.
   */
  async function signInWithProvider(
    provider: string,
    options: SignInWithProviderOptions = {}
  ): Promise<void> {
    const { returnTo, flow: existingFlow, prompt } = options;
    try {
      userStore.setIsLoading(true);

      let flow: KratosFlow;
      if (existingFlow) {
        // Same reasoning as signMeIn: a Kratos-supplied flow carries state we
        // would discard by starting over.
        flow = existingFlow;
      } else {
        try {
          flow = await kratosService.initLoginFlow(false, returnTo);
        } catch (error: unknown) {
          if (
            !isKratosErrorId(error, KratosErrorIds.SESSION_ALREADY_AVAILABLE)
          ) {
            throw error;
          }
          // A live session blocks a new login flow. The user asked to sign in
          // with a provider, so honour that: drop the session and retry once.
          await clearSession();
          flow = await kratosService.initLoginFlow(false, returnTo);
        }
      }

      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");
      if (!csrfToken) {
        throw new Error("CSRF token not found in login flow");
      }

      submitFormNavigation(kratosService.buildFlowSubmitUrl(flow.ui.action), {
        csrf_token: csrfToken,
        provider,
        // Dotted name on purpose: Kratos decodes form fields into the nested
        // `upstream_parameters` object its schema declares, the same way
        // `traits.email` works. It allows only login_hint / hd / prompt /
        // auth_type and drops anything else.
        ...(prompt ? { "upstream_parameters.prompt": prompt } : {}),
      });
    } catch (error: unknown) {
      userStore.setIsLoading(false);
      const axiosError = error as AxiosError<{
        ui?: { messages?: Array<{ text: string }> };
        error?: { message?: string };
      }>;
      notifications.error(
        t("auth.error"),
        axiosError.response?.data?.ui?.messages?.[0]?.text ||
          axiosError.message ||
          t("auth.loginError")
      );
      throw error;
    }
    // No `finally`: on the success path the browser is already navigating away,
    // and clearing the loading flag would flash the form back into view.
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
    signInWithProvider,
    signMeUp,
    signMeOut,
    clearSession,
    requestPasswordReset,
    getSessionToken,
  };
};
