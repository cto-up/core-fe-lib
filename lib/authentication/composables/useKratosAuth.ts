/**
 * Kratos Auth Composable
 *
 */

import { ref, computed, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { notificationServiceKey } from "../../plugins/injection-keys";
import {
  kratosService,
  type KratosSession,
  type KratosFlowNode,
  type PasswordLoginFlowData,
} from "../services/kratos.service";
import { useUserStore } from "core-fe-lib/stores/user-store";
import { updateUserFromSession } from "../utils/kratos-update-user";
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

  const session = ref<KratosSession | null>(null);
  const isLoading = ref(false);

  /**
   * Check if user is logged in
   */
  const isLoggedIn = computed(() => {
    return session.value?.active ?? false;
  });

  /**
   * Get current session
   */
  const getCurrentSession = async (): Promise<KratosSession | null> => {
    try {
      isLoading.value = true;
      const currentSession = await kratosService.getSession();
      session.value = currentSession;
      await updateUserFromSession(currentSession);
      return currentSession;
    } catch (error) {
      console.error("Error getting session:", error);
      session.value = null;
      userStore.setUser(null);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Sign in with email and password
   */
  const signMeIn = async (email: string, password: string) => {
    try {
      isLoading.value = true;

      // Initialize login flow to get CSRF token
      const flow = await kratosService.initLoginFlow(
        false,
        route.query["from"] as string
      );

      console.log("🔐 Login flow initialized:", flow.id);

      // Extract CSRF token from flow UI nodes
      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");

      console.log("🎫 CSRF token extracted:", {
        found: !!csrfToken,
        tokenLength: csrfToken.length,
        tokenPreview: csrfToken.substring(0, 20) + "...",
      });

      if (!csrfToken) {
        throw new Error("CSRF token not found in login flow");
      }

      // Submit login with CSRF token
      // IMPORTANT: Send csrf_token exactly as received, no encoding
      const loginData: PasswordLoginFlowData = {
        method: "password",
        csrf_token: csrfToken, // Send exactly as received
        identifier: email,
        password: password,
      };

      console.log("📤 Submitting login to flow:", flow.id);

      const loginResponse = await kratosService.submitLoginFlow(
        flow.id,
        loginData
      );

      console.log("✅ Login successful");

      // Extract session from login response if available
      if (loginResponse && "active" in loginResponse && loginResponse.active) {
        session.value = loginResponse as KratosSession;
        await updateUserFromSession(loginResponse as KratosSession);
        console.log("✅ User set from login response");
      } else {
        // Fallback: fetch session if not in response
        await getCurrentSession();
      }

      // Redirect to intended page or home
      const redirectTo = (route.query["from"] as string) || "/";
      router.push(redirectTo);

      notifications.success(t("auth.success"), t("auth.loginSuccess"));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        ui?: { messages?: Array<{ text: string }> };
        error?: { message?: string };
      }>;
      console.error("❌ Login error:", error);
      console.error("Error response:", axiosError.response?.data);

      const errorMessage =
        axiosError.response?.data?.ui?.messages?.[0]?.text ||
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        t("auth.loginError");

      notifications.error(t("auth.error"), errorMessage);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Sign up with email and password
   * Optionally associates user with tenant based on subdomain
   */
  const signMeUp = async (
    email: string,
    password: string,
    name?: string,
    tenantSubdomain?: string
  ) => {
    try {
      isLoading.value = true;

      // Store tenant context if provided (for post-registration webhook)
      if (tenantSubdomain) {
        sessionStorage.setItem("pending_tenant", tenantSubdomain);
      }

      // Initialize registration flow to get CSRF token
      const flow = await kratosService.initRegistrationFlow();

      // Extract CSRF token from flow UI nodes
      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");

      if (!csrfToken) {
        throw new Error("CSRF token not found in registration flow");
      }

      // Prepare traits with tenant information
      const traits: { email: string; name?: string; subdomain?: string } = {
        email,
        name: name || "",
      };

      // If tenant subdomain is provided, include it in traits
      // This will be stored in identity metadata by Kratos
      if (tenantSubdomain) {
        traits.subdomain = tenantSubdomain;
      }

      // Submit registration with CSRF token
      await kratosService.submitRegistrationFlow(flow.id, {
        traits,
        password,
        method: "password",
        csrf_token: csrfToken, // Include CSRF token
      });

      // Get session after successful registration
      await getCurrentSession();

      // Clear pending tenant
      sessionStorage.removeItem("pending_tenant");

      // Redirect to profile or home
      router.push("/user/me/profile");

      notifications.success(t("auth.success"), t("auth.registrationSuccess"));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        ui?: { messages?: Array<{ text: string }> };
        error?: { message?: string };
      }>;
      console.error("Registration error:", error);

      const errorMessage =
        axiosError.response?.data?.ui?.messages?.[0]?.text ||
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        t("auth.registrationError");

      notifications.error(t("auth.error"), errorMessage);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Sign out
   */
  const signMeOut = async () => {
    try {
      isLoading.value = true;
      await kratosService.logout();

      session.value = null;
      userStore.setUser(null);

      router.push({ name: "home" });

      notifications.success(t("auth.success"), t("auth.logoutSuccess"));
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("Logout error:", error);

      notifications.error(
        t("auth.error"),
        axiosError.message || t("auth.logoutError")
      );
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email: string) => {
    try {
      isLoading.value = true;

      // Initialize recovery flow to get CSRF token
      const flow = await kratosService.initRecoveryFlow();

      // Extract CSRF token from flow UI nodes
      const csrfNode = flow.ui.nodes.find(
        (node: KratosFlowNode) => node.attributes?.name === "csrf_token"
      );
      const csrfToken = String(csrfNode?.attributes?.value || "");

      if (!csrfToken) {
        throw new Error("CSRF token not found in recovery flow");
      }

      // Submit recovery request with CSRF token
      await kratosService.submitRecoveryFlow(flow.id, {
        email,
        method: "link",
        csrf_token: csrfToken, // Include CSRF token
      });

      notifications.success(
        t("auth.success"),
        t("auth.passwordResetEmailSent")
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("Password reset error:", error);

      notifications.error(
        t("auth.error"),
        axiosError.message || t("auth.passwordResetError")
      );
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get session token for API calls
   */
  const getSessionToken = async (): Promise<string | null> => {
    try {
      const currentSession = await kratosService.getSession();
      // Kratos uses session cookies, but you can also use the session ID
      return currentSession?.id || null;
    } catch (error) {
      console.error("Error getting session token:", error);
      return null;
    }
  };

  return {
    session,
    isLoading,
    isLoggedIn,
    getCurrentSession,
    signMeIn,
    signMeUp,
    signMeOut,
    requestPasswordReset,
    getSessionToken,
  };
};
