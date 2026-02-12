// Composables
export { useKratosAuth } from "./composables/useKratosAuth";
export { useAal2, submitWebAuthnVerification } from "./composables/useAal2";
export { useTenant } from "./composables/useTenant";
export { useMfa } from "./composables/useMfa";

// Services
export { kratosService } from "./services/kratos.service";
export type {
  KratosSession,
  KratosFlow,
  KratosFlowNode,
  KratosIdentity,
  KratosFlowResponse,
  PasswordLoginFlowData,
  TotpLoginFlowData,
  LookupSecretLoginFlowData,
  LoginFlowData,
} from "./services/kratos.service";

// Utils
export { getAuthOrigin, buildWebAuthnVerifyUrl } from "./utils/auth-domain";
export { updateUserFromSession } from "./utils/kratos-update-user";
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
} from "./utils/kratos-error-processor";

export {
  getSecretFromFlow,
  extractRecoveryCodes,
} from "./utils/kratos-flow-helpers";

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
} from "./types/kratos-errors";
