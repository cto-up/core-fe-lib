/**
 * Vue composable for AAL2 verification UI interactions
 */

import { useI18n } from "vue-i18n";
import { inject } from "vue";
import { notificationServiceKey } from "../../plugins/injection-keys";
import { useAal2Store } from "./aal2-store";
import { buildWebAuthnVerifyUrl } from "../core/auth-domain";

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

  globalThis.location.href = verifyUrl;
}

export function useAal2() {
  const { t } = useI18n();
  const notifications = inject(notificationServiceKey)!;
  const aal2Store = useAal2Store();

  if (!notifications) {
    throw new Error(
      "NotificationService not provided. Ensure the UI services are provided at the app level."
    );
  }

  async function submitTotpVerification() {
    if (!aal2Store.state.flowId || !aal2Store.state.totpCode) {
      aal2Store.updateState({ error: t("mfa.setup.totp.enterCode") });
      return;
    }

    try {
      await aal2Store.manager.submitTotp();
      notifications.success(
        t("mfa.notifications.verificationSuccess"),
        t("mfa.notifications.verificationSuccessDesc")
      );
    } catch (error: unknown) {
      console.error("TOTP verification failed:", error);
      aal2Store.updateState({
        error:
          t("mfa.setup.totp.invalidCode") || "Invalid code. Please try again.",
      });
    }
  }

  async function submitLookupVerification() {
    if (!aal2Store.state.flowId || !aal2Store.state.lookupCode) {
      aal2Store.updateState({ error: t("mfa.recovery.enterCode") });
      return;
    }

    try {
      await aal2Store.manager.submitLookup();
      notifications.success(
        t("mfa.notifications.verificationSuccess"),
        t("mfa.notifications.verificationSuccessDesc")
      );
    } catch (error: unknown) {
      console.error("Lookup verification failed:", error);
      aal2Store.updateState({
        error:
          t("mfa.recovery.invalidCode") || "Invalid code. Please try again.",
      });
    }
  }

  function validateTotpInput() {
    const cleaned = aal2Store.manager.validateTotpInput(
      aal2Store.state.totpCode
    );
    aal2Store.updateState({ totpCode: cleaned, error: "" });
  }

  function validateLookupInput() {
    const cleaned = aal2Store.manager.validateLookupInput(
      aal2Store.state.lookupCode
    );
    aal2Store.updateState({ lookupCode: cleaned, error: "" });
  }

  function cancelAal2Verification() {
    aal2Store.resolveVerification(false);
  }

  function switchToMethod(method: "totp" | "webauthn" | "lookup_secret") {
    aal2Store.manager.switchMethod(method);
  }

  return {
    aal2State: aal2Store.state,
    submitTotpVerification,
    submitWebAuthnVerification,
    submitLookupVerification,
    validateTotpInput,
    validateLookupInput,
    cancelAal2Verification,
    switchToMethod,
  };
}
