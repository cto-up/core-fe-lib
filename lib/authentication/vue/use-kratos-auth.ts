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
  type KratosFlowNode,
  type PasswordLoginFlowData,
} from "../core/kratos-service";
import type { AxiosError } from "axios";

export const useKratosAuth = () => {
  const router = useRouter();
  const route = useRoute();
  const { t } = useI18n();
  const notifications = inject(notificationServiceKey);
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

  async function signMeIn(email: string, password: string): Promise<void> {
    try {
      userStore.setIsLoading(true);

      const returnTo = route.query["from"] as string;
      const flow = await kratosService.initLoginFlow(false, returnTo);

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

      const redirectTo = returnTo || "/";
      router.push(redirectTo);

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

  async function signMeOut(): Promise<void> {
    try {
      userStore.setIsLoading(true);
      await kratosService.logout();
      await updateUserFromSession(null);
      router.push({ name: "home" });
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
    requestPasswordReset,
    getSessionToken,
  };
};
