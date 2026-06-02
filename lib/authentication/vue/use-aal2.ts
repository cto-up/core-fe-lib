/**
 * Vue composable for AAL2 verification UI interactions
 */

import { useI18n } from "vue-i18n";
import { inject } from "vue";
import { notificationServiceKey } from "../../plugins/injection-keys";
import { useAal2Store } from "./aal2-store";
import { buildWebAuthnVerifyUrl } from "../core/auth-domain";

/**
 * Same-tab WebAuthn fallback: navigates to the auth subdomain for the ceremony.
 * Used only when a popup cannot be opened (blocked or unavailable). This path
 * full-page-navigates away and loses unsaved in-memory state, so prefer the
 * popup flow returned by useAal2().
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

  /**
   * Run the WebAuthn ceremony in a popup on the auth subdomain (the one origin
   * present in Kratos rp.origins for every tenant). The popup reports its result
   * via postMessage, so the tenant SPA never unmounts and in-progress form state
   * survives. The interceptor's triggerVerification() promise resolves here, then
   * the original request is retried. Falls back to a same-tab redirect if the
   * popup is blocked.
   *
   * Must be called from a user gesture (the dialog's Verify click) so the popup
   * is not blocked.
   */
  function submitWebAuthnPopupVerification() {
    const returnUrl = globalThis.location.href;
    const verifyUrl = buildWebAuthnVerifyUrl(returnUrl, "popup");
    const expectedOrigin = new URL(verifyUrl).origin;

    const popup = globalThis.open(
      verifyUrl,
      "aal2-webauthn",
      "popup,width=480,height=640"
    );

    // Popup blocked → fall back to same-tab redirect (functional, loses state).
    if (!popup) {
      console.warn("⚠️ WebAuthn popup blocked; falling back to redirect");
      globalThis.location.href = verifyUrl;
      return;
    }

    let settled = false;

    function cleanup() {
      globalThis.removeEventListener("message", onMessage);
      globalThis.clearInterval(closeTimer);
    }

    function settle(success: boolean) {
      if (settled) return;
      settled = true;
      cleanup();
      if (!popup!.closed) popup!.close();
      if (success) {
        notifications.success(
          t("mfa.notifications.verificationSuccess"),
          t("mfa.notifications.verificationSuccessDesc")
        );
      }
      // Resolves the interceptor's pending triggerVerification() promise.
      aal2Store.resolveVerification(success);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== expectedOrigin) return;
      const data = event.data as { type?: string; success?: boolean } | null;
      if (!data || data.type !== "aal2-webauthn") return;
      settle(Boolean(data.success));
    }

    globalThis.addEventListener("message", onMessage);

    // User dismissed the popup (window X) without a result: leave the AAL2
    // dialog open so they can retry or switch method. Only an explicit message
    // resolves the verification promise.
    const closeTimer = globalThis.setInterval(() => {
      if (popup.closed && !settled) {
        cleanup();
      }
    }, 500);
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
    submitWebAuthnPopupVerification,
    submitLookupVerification,
    validateTotpInput,
    validateLookupInput,
    cancelAal2Verification,
    switchToMethod,
  };
}
