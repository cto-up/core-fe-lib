// ============================================================================
// CORE (framework-agnostic, zero Vue/React dependencies)
// ============================================================================

// Configuration
export { configureKratos } from "./core/kratos-config";
export type { KratosConfig } from "./core/kratos-config";

// Kratos service
export { kratosService } from "./core/kratos-service";
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
} from "./core/kratos-service";

// AAL2 manager (pure state machine)
export { Aal2Manager } from "./core/aal2-manager";
export type { Aal2VerificationState, IStateStore } from "./core/aal2-manager";

// Error processing
export {
  KratosErrorIds,
  isAal2Required,
  handleAal2Error,
  extractKratosError,
  extractValidationErrors,
  getUserFriendlyMessage,
  shouldRedirect,
  handleKratosError,
  isKratosErrorId,
} from "./core/kratos-error-processor";

// Flow helpers
export {
  getSecretFromFlow,
  extractRecoveryCodes,
} from "./core/kratos-flow-helpers";

// Auth domain helpers
export {
  getAuthOrigin,
  buildWebAuthnVerifyUrl,
  buildWebAuthnRegisterUrl,
} from "./core/auth-domain";

// Types
export type {
  KratosStandardError,
  KratosGenericError,
  KratosFlowError,
  KratosUIMessage,
  KratosUINode,
  KratosNodeAttributes,
  KratosInputAttributes,
  KratosImageAttributes,
  KratosAnchorAttributes,
  KratosTextAttributes,
  KratosScriptAttributes,
  KratosErrorResponse,
  ParsedKratosError,
  KratosValidationError,
  SettingsFlowNode,
} from "./core/types/kratos-errors";
