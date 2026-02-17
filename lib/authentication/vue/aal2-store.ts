/**
 * Vue Pinia store for AAL2 verification
 * Uses framework-agnostic Aal2Manager with a closure-based state adapter.
 *
 * SELF-INITIALIZING: Initializes the AAL2 flow directly on trigger,
 * without depending on component mounting.
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import {
  Aal2Manager,
  type Aal2VerificationState,
  type IStateStore,
} from "../core/aal2-manager";

export const useAal2Store = defineStore("aal2", () => {
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

  // Closure-based adapter — avoids the Pinia ref-unwrapping issue
  const stateAdapter: IStateStore<Aal2VerificationState> = {
    getState: () => state.value,
    setState: (updates) => Object.assign(state.value, updates),
  };

  const manager = new Aal2Manager(stateAdapter);

  /**
   * Trigger verification with automatic initialization.
   * Called by the axios interceptor when AAL2 is required.
   */
  async function triggerVerification(): Promise<boolean> {
    const promise = manager.triggerVerification();

    try {
      const { MfaService } = await import("core-fe-lib/openapi/core");
      await manager.initializeFlow(() => MfaService.getMfaStatus());
    } catch (error) {
      console.error("Failed to initialize AAL2 flow:", error);
      manager.resolveVerification(false);
    }

    return promise;
  }

  return {
    state,
    triggerVerification,
    resolveVerification: (success: boolean) =>
      manager.resolveVerification(success),
    updateState: (updates: Partial<Aal2VerificationState>) =>
      Object.assign(state.value, updates),
    resetState: () => manager.reset(),
    manager,
  };
});
