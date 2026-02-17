// ============================================================================
// Re-export everything from core (so Vue consumers have a single import)
// ============================================================================
export * from "./index";

// ============================================================================
// VUE-SPECIFIC (Pinia stores, Vue composables)
// ============================================================================
export { useKratosAuth } from "./vue/use-kratos-auth";
export { useAal2, submitWebAuthnVerification } from "./vue/use-aal2";
export { useAal2Store } from "./vue/aal2-store";
export { useMfa } from "./vue/use-mfa";
export { useTenant } from "./vue/use-tenant";
export { updateUserFromSession } from "./vue/kratos-update-user";
