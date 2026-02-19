// React hooks and providers for Kratos authentication

// Context Providers
export { KratosUserProvider, useKratosUserStore } from "./user-context";
export { TenantProvider, useTenantStore } from "./tenant-context";
export { Aal2Provider, useAal2Store } from "./aal2-store";

// Hooks
export { useKratosAuth } from "./use-kratos-auth";
export { useMfa } from "./use-mfa";
export { useAal2, submitWebAuthnVerification } from "./use-aal2";
export { useTenant } from "./use-tenant";
export { useUpdateUserFromSession } from "./kratos-update-user";
export { useDialog } from "./use-dialog";

// Re-export core configuration and error handling
export { configureKratos } from "../core/kratos-config";
export type { KratosConfig } from "../core/kratos-config";
export {
    isAal2Required,
    handleAal2Error,
    extractKratosError,
    extractValidationErrors,
    getUserFriendlyMessage,
} from "../core/kratos-error-processor";

// Re-export core types and services
export type {
    KratosSession,
    KratosFlow,
    KratosFlowNode,
    KratosIdentity,
    KratosFlowResponse,
    PasswordLoginFlowData,
    TotpLoginFlowData,
    LookupSecretLoginFlowData,
    WebAuthnLoginFlowData,
    LoginFlowData,
} from "../core/kratos-service";

export type { Aal2VerificationState, IStateStore } from "../core/aal2-manager";

export { kratosService } from "../core/kratos-service";
export { Aal2Manager } from "../core/aal2-manager";
