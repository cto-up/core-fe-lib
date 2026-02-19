// ============================================================================
// Re-export everything from core (so React consumers have a single import)
// ============================================================================
export * from "./index";

// ============================================================================
// REACT-SPECIFIC (Context providers, React hooks)
// ============================================================================
export { useKratosAuth } from "./next/use-kratos-auth";
export { useAal2, submitWebAuthnVerification } from "./next/use-aal2";
export { Aal2Provider, useAal2Store } from "./next/aal2-store";
export { useMfa } from "./next/use-mfa";
export { useTenant } from "./next/use-tenant";
export { useUpdateUserFromSession } from "./next/kratos-update-user";
export { KratosUserProvider, useKratosUserStore } from "./next/user-context";
export { TenantProvider, useTenantStore } from "./next/tenant-context";
export { useDialog } from "./next/use-dialog";
