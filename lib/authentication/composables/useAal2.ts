import { useI18n } from "vue-i18n";
import { inject } from "vue";
import {
  kratosService,
  type KratosFlowNode,
  type TotpLoginFlowData,
  type LookupSecretLoginFlowData,
} from "../services/kratos.service";
import { notificationServiceKey } from "../../plugins/injection-keys";
import { useAal2Store } from "../stores/aal2-store";
import { buildWebAuthnVerifyUrl } from "../utils/auth-domain";

/**
 * Submit WebAuthn for AAL2 verification
 * Navigates to auth subdomain for same-origin requirement
 */
export function submitWebAuthnVerification() {
  const verifyUrl = buildWebAuthnVerifyUrl();

  console.log("🔐 Navigating to auth subdomain for WebAuthn verification:", {
    currentUrl: globalThis.location.href,
    verifyUrl,
  });

  // Navigate to auth subdomain
  globalThis.location.href = verifyUrl;
}

export function useAal2() {
  const { t } = useI18n();
  const notifications = inject(notificationServiceKey);
  const aal2Store = useAal2Store();

  if (!notifications) {
    throw new Error(
      "NotificationService not provided. Ensure the UI services are provided at the app level."
    );
  }

  // Register the flow initializer with the store
  aal2Store.registerInitializer(promptAal2Verification);

  /**
   * Prompt user for AAL2 verification
   * This is called automatically by the axios interceptor when AAL2 is required
   */
  async function promptAal2Verification(): Promise<void> {
    try {
      // Get current session to extract user email
      const session = await kratosService.getSession();
      if (!session?.identity?.traits?.email) {
        console.error("❌ No session or email found for AAL2 verification");
        notifications.error(
          t("core.mfa.notifications.verificationError"),
          "Unable to verify session. Please log in again."
        );
        return;
      }

      const userEmail = session.identity.traits.email;

      // Get available MFA methods from MfaService
      const { MfaService } = await import("core-fe-lib/openapi/core");
      const mfaStatus = await MfaService.getMfaStatus();

      // Build available methods array based on MFA status
      const availableMethods: Array<"totp" | "webauthn" | "lookup_secret"> = [];
      if (mfaStatus.totp_enabled) {
        availableMethods.push("totp");
      }
      if (mfaStatus.webauthn_enabled) {
        availableMethods.push("webauthn");
      }
      if (mfaStatus.recovery_codes_set) {
        availableMethods.push("lookup_secret");
      }

      if (availableMethods.length === 0) {
        console.error("❌ No MFA methods available for AAL2 verification");
        notifications.error(
          t("core.mfa.notifications.noMethodsAvailable"),
          t("core.mfa.notifications.noMethodsAvailableDesc")
        );
        return;
      }

      console.log("✅ Available MFA methods for AAL2:", availableMethods);

      // Initialize AAL2 upgrade flow
      const flow = await kratosService.initAal2UpgradeFlow();

      console.log("🔐 AAL2 login flow initialized:", {
        flowId: flow.id,
        userEmail,
        availableMethods,
        allNodes: flow.ui?.nodes?.map((n: KratosFlowNode) => ({
          group: n.group,
          type: n.type,
          name: n.attributes?.name,
        })),
        messages: flow.ui?.messages,
      });

      // Extract CSRF token and internal identifier from the flow nodes
      // In AAL2, Kratos often provides a hidden 'identifier' node with the identity ID
      let csrfToken = "";
      let flowIdentifier = userEmail;

      flow.ui?.nodes?.forEach((node: KratosFlowNode) => {
        if (node.attributes?.name === "csrf_token") {
          csrfToken = String(node.attributes.value || "");
        } else if (node.attributes?.name === "identifier") {
          // If the identifier node is present, use its value (could be email or identity ID)
          flowIdentifier = String(node.attributes.value || flowIdentifier);
        }
      });

      // Extract WebAuthn challenge if available
      let webauthnChallenge: string | undefined;
      if (availableMethods.includes("webauthn")) {
        const webauthnNode = flow.ui?.nodes?.find(
          (node: KratosFlowNode) =>
            node.attributes?.name === "webauthn_login_trigger"
        );
        if (webauthnNode?.attributes?.value) {
          webauthnChallenge = String(webauthnNode.attributes.value);
          console.log("🔑 Stored WebAuthn challenge from initial flow");
        }
      }

      // Update shared state
      aal2Store.updateState({
        flowId: flow.id,
        csrfToken: csrfToken,
        availableMethods,
        selectedMethod: availableMethods[0], // Auto-select first available
        totpCode: "",
        lookupCode: "",
        error: "",
        loading: false,
        userEmail: flowIdentifier,
        identityId: session.identity.id,
        webauthnChallenge,
      });
    } catch (error) {
      console.error("Failed to initialize AAL2 verification:", error);
      notifications.error(
        t("core.mfa.notifications.verificationError"),
        t("core.mfa.notifications.verificationErrorDesc")
      );
    }
  }

  /**
   * Submit TOTP code for AAL2 verification
   */
  async function submitTotpVerification() {
    if (!aal2Store.state.flowId || !aal2Store.state.totpCode) {
      aal2Store.updateState({ error: t("core.mfa.setup.totp.enterCode") });
      return;
    }

    try {
      aal2Store.updateState({ loading: true, error: "" });

      console.log("🔐 Submitting TOTP for AAL2:", {
        flowId: aal2Store.state.flowId,
        method: "totp",
        totpCode: aal2Store.state.totpCode,
      });

      const totpData: TotpLoginFlowData = {
        method: "totp",
        csrf_token: aal2Store.state.csrfToken,
        identifier: aal2Store.state.userEmail || "",
        totp_code: aal2Store.state.totpCode,
      };

      await kratosService.submitLoginFlow(aal2Store.state.flowId, totpData);

      // Success - resolve the verification
      aal2Store.resolveVerification(true);
      notifications.success(
        t("core.mfa.notifications.verificationSuccess"),
        t("core.mfa.notifications.verificationSuccessDesc")
      );
    } catch (error: unknown) {
      console.error("TOTP verification failed:", error);
      aal2Store.updateState({
        error:
          t("core.mfa.setup.totp.invalidCode") ||
          "Invalid code. Please try again.",
      });
    } finally {
      aal2Store.updateState({ loading: false });
    }
  }

  /**
   * Submit recovery code for AAL2 verification
   */
  async function submitLookupVerification() {
    if (!aal2Store.state.flowId || !aal2Store.state.lookupCode) {
      aal2Store.updateState({ error: t("core.mfa.recovery.enterCode") });
      return;
    }

    try {
      aal2Store.updateState({ loading: true, error: "" });

      const lookupData: LookupSecretLoginFlowData = {
        method: "lookup_secret",
        csrf_token: aal2Store.state.csrfToken,
        identifier: aal2Store.state.userEmail || "",
        lookup_secret: aal2Store.state.lookupCode,
      };

      await kratosService.submitLoginFlow(aal2Store.state.flowId, lookupData);

      // Success - resolve the verification
      aal2Store.resolveVerification(true);
      notifications.success(
        t("core.mfa.notifications.verificationSuccess"),
        t("core.mfa.notifications.verificationSuccessDesc")
      );
    } catch (error: unknown) {
      console.error("Lookup verification failed:", error);
      aal2Store.updateState({
        error:
          t("core.mfa.recovery.invalidCode") ||
          "Invalid code. Please try again.",
      });
    } finally {
      aal2Store.updateState({ loading: false });
    }
  }

  /**
   * Validate TOTP input (6 digits only)
   */
  function validateTotpInput() {
    const cleaned = aal2Store.state.totpCode.replace(/\D/g, "").slice(0, 6);
    aal2Store.updateState({ totpCode: cleaned, error: "" });
  }

  /**
   * Validate lookup code input
   */
  function validateLookupInput() {
    const cleaned = aal2Store.state.lookupCode
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 12);
    aal2Store.updateState({ lookupCode: cleaned, error: "" });
  }

  /**
   * Cancel AAL2 verification
   */
  function cancelAal2Verification() {
    aal2Store.resolveVerification(false);
  }

  /**
   * Switch to a different verification method
   */
  function switchToMethod(method: "totp" | "webauthn" | "lookup_secret") {
    aal2Store.updateState({
      selectedMethod: method,
      totpCode: "",
      lookupCode: "",
      error: "",
    });
  }

  return {
    aal2State: aal2Store.state,
    promptAal2Verification,
    submitTotpVerification,
    submitWebAuthnVerification,
    submitLookupVerification,
    validateTotpInput,
    validateLookupInput,
    cancelAal2Verification,
    switchToMethod,
  };
}
