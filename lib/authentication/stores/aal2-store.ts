/**
 * AAL2 (Authenticator Assurance Level 2) Verification Store
 *
 * Manages the state for MFA verification dialogs triggered by privileged operations
 */

import { defineStore } from "pinia";
import { ref } from "vue";

export interface Aal2VerificationState {
  show: boolean;
  flowId: string | null;
  csrfToken: string;
  availableMethods: Array<"totp" | "webauthn" | "lookup_secret">;
  selectedMethod: "totp" | "webauthn" | "lookup_secret" | null;
  totpCode: string;
  lookupCode: string;
  error: string;
  loading: boolean;
  userEmail?: string;
  identityId?: string; // Store current identity ID for verification
  webauthnChallenge?: string; // Store the WebAuthn challenge from initial flow
}

export const useAal2Store = defineStore("aal2", () => {
  // State
  const state = ref<Aal2VerificationState>({
    show: false,
    flowId: null,
    csrfToken: "",
    availableMethods: [],
    selectedMethod: null,
    totpCode: "",
    lookupCode: "",
    error: "",
    loading: false,
  });

  // Promise resolver for AAL2 verification
  let verificationResolve: ((success: boolean) => void) | null = null;

  // Initialization callback - set by useAal2 composable
  let initializeFlowFn: (() => Promise<void>) | null = null;

  // Actions
  function triggerVerification(): Promise<boolean> {
    return new Promise((resolve) => {
      verificationResolve = resolve;
      state.value.show = true;

      // Initialize the flow if callback is registered
      if (initializeFlowFn) {
        initializeFlowFn().catch((error) => {
          console.error("Failed to initialize AAL2 flow:", error);
          // Resolve with false on initialization error
          if (verificationResolve) {
            verificationResolve(false);
            verificationResolve = null;
          }
        });
      }
    });
  }

  function resolveVerification(success: boolean) {
    state.value.show = false;
    state.value.totpCode = "";
    state.value.lookupCode = "";
    state.value.error = "";

    if (verificationResolve) {
      verificationResolve(success);
      verificationResolve = null;
    }
  }

  function updateState(updates: Partial<Aal2VerificationState>) {
    Object.assign(state.value, updates);
  }

  function resetState() {
    state.value = {
      show: false,
      flowId: null,
      csrfToken: "",
      availableMethods: [],
      selectedMethod: null,
      totpCode: "",
      lookupCode: "",
      error: "",
      loading: false,
    };
  }

  function registerInitializer(fn: () => Promise<void>) {
    initializeFlowFn = fn;
  }

  return {
    // State
    state,

    // Actions
    triggerVerification,
    resolveVerification,
    updateState,
    resetState,
    registerInitializer,
  };
});
