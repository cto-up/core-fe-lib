// utils/kratosError.ts
import type { AxiosError } from "axios";
import type {
  ParsedKratosError,
  KratosUIMessage,
  KratosValidationError,
  KratosStandardError,
  KratosGenericError,
  KratosFlowError,
} from "../types/kratos-errors";

/**
 * Common Kratos error IDs
 */
export const KratosErrorIds = {
  SESSION_REFRESH_REQUIRED: "session_refresh_required",
  SESSION_ALREADY_AVAILABLE: "session_already_available",
  SESSION_AAL2_REQUIRED: "session_aal2_required",
  BROWSER_LOCATION_CHANGE_REQUIRED: "browser_location_change_required",
  SELF_SERVICE_FLOW_EXPIRED: "self_service_flow_expired",
  SELF_SERVICE_FLOW_REPLACED: "self_service_flow_replaced",
  SECURITY_CSRF_VIOLATION: "security_csrf_violation",
  SECURITY_IDENTITY_MISMATCH: "security_identity_mismatch",
} as const;

/**
 * Extracts Kratos error information from an Axios error response
 * Handles multiple error response formats from Kratos
 */
export function extractKratosError(error: unknown): ParsedKratosError | null {
  if (!isAxiosError(error)) {
    console.log(JSON.stringify(error));

    const newError = {
      id: error?.body?.code || "unknown_error",
      status: error?.status,
      reason: "",
      message: error?.body?.message || "Network error",
    };
    return newError as ParsedKratosError;
  }

  const data = error.response?.data;
  const status = error.response?.status || 500;
  const statusText = error.response?.statusText || "Error";

  if (!data) {
    return {
      code: status,
      status: statusText,
      reason: error.message || "Network error",
      message: "An error occurred while communicating with the server",
    };
  }

  // Handle string errors
  if (typeof data === "string") {
    return {
      code: status,
      status: statusText,
      reason: data,
      message: data,
    };
  }

  // Handle standard error format with nested error object
  if (isStandardError(data)) {
    return {
      id: data.error.id,
      code: data.error.code || status,
      status: data.error.status || statusText,
      reason: data.error.reason || data.error.message,
      message: data.error.message,
      redirectTo: data.redirect_browser_to,
      details: data.error.details,
    };
  }

  // Handle generic error format
  if (isGenericError(data)) {
    return {
      code: data.error.code || status,
      status: data.error.status || statusText,
      reason: data.error.reason || data.error.message,
      message: data.error.message,
    };
  }

  // Handle flow error format (login, registration, settings, etc.)
  if (isFlowError(data)) {
    const uiMessages = extractUIMessages(data);
    const validationErrors = extractValidationErrorsFromFlow(data);

    return {
      id: data.error?.id || data.id,
      code: data.error?.code || status,
      status: data.error?.status || statusText,
      reason: data.error?.reason || getReasonFromUIMessages(uiMessages),
      message: data.error?.message || getMessageFromUIMessages(uiMessages),
      uiMessages,
      validationErrors,
      flowId: data.id,
    };
  }

  // Handle simple { message: "error" } format
  if (data.message && typeof data.message === "string") {
    return {
      id: data.code,
      code: status,
      status: statusText,
      reason: data.message,
      message: data.message,
    };
  }

  // Handle simple { error: "description" } format
  if (data.error && typeof data.error === "string") {
    return {
      id: data.code,
      code: status,
      status: statusText,
      reason: data.error,
      message: data.error,
    };
  }

  // Fallback for unknown formats
  return {
    id: data.code,
    code: status,
    status: statusText,
    reason: "An unknown error occurred",
    message: JSON.stringify(data),
  };
}

/**
 * Type guards for different error formats
 */
function isStandardError(data: any): data is KratosStandardError {
  return (
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    ("id" in data.error || "code" in data.error)
  );
}

function isGenericError(data: any): data is KratosGenericError {
  return (
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    !("id" in data.error)
  );
}

function isFlowError(data: any): data is KratosFlowError {
  return (
    data.id &&
    data.type &&
    data.ui &&
    typeof data.ui === "object" &&
    Array.isArray(data.ui.nodes)
  );
}

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Extracts UI messages from Kratos flow response
 */
function extractUIMessages(data: any): KratosUIMessage[] {
  const messages: KratosUIMessage[] = [];

  // Check for UI messages at the flow level
  if (data.ui?.messages && Array.isArray(data.ui.messages)) {
    messages.push(...data.ui.messages);
  }

  // Check for node-level messages
  if (data.ui?.nodes && Array.isArray(data.ui.nodes)) {
    for (const node of data.ui.nodes) {
      if (node.messages && Array.isArray(node.messages)) {
        messages.push(...node.messages);
      }
    }
  }

  return messages;
}

/**
 * Extracts validation errors from flow nodes
 */
function extractValidationErrorsFromFlow(data: any): KratosValidationError[] {
  const validationErrors: KratosValidationError[] = [];

  if (data.ui?.nodes && Array.isArray(data.ui.nodes)) {
    for (const node of data.ui.nodes) {
      if (node.messages && node.messages.length > 0) {
        const fieldName = node.attributes?.name || "unknown";
        const errorMessages = node.messages.filter(
          (msg: KratosUIMessage) => msg.type === "error"
        );

        if (errorMessages.length > 0) {
          validationErrors.push({
            field: fieldName,
            messages: errorMessages,
          });
        }
      }
    }
  }

  return validationErrors;
}

/**
 * Gets reason from UI messages
 */
function getReasonFromUIMessages(messages?: KratosUIMessage[]): string {
  if (!messages || messages.length === 0) {
    return "An error occurred";
  }

  const errorMessage = messages.find((msg) => msg.type === "error");
  return errorMessage?.text || messages[0].text || "An error occurred";
}

/**
 * Gets message from UI messages
 */
function getMessageFromUIMessages(messages?: KratosUIMessage[]): string {
  if (!messages || messages.length === 0) {
    return "An error occurred";
  }

  const errorMessages = messages.filter((msg) => msg.type === "error");
  if (errorMessages.length > 0) {
    return errorMessages.map((msg) => msg.text).join(". ");
  }

  return messages[0].text || "An error occurred";
}

/**
 * Extracts validation errors - now handles all error formats
 */
export function extractValidationErrors(
  error: unknown
): KratosValidationError[] {
  const kratosError = extractKratosError(error);
  return kratosError?.validationErrors || [];
}

/**
 * Gets a user-friendly error message from any Kratos error format
 */
export function getUserFriendlyMessage(error: unknown): string | null {
  const kratosError = extractKratosError(error);

  if (!kratosError) {
    return null;
  }

  // Prioritize specific reason over generic message
  if (
    kratosError.reason &&
    kratosError.reason !== kratosError.message &&
    isGenericMessage(kratosError.message)
  ) {
    return kratosError.reason;
  }

  return kratosError.message || kratosError.reason || "An error occurred";
}

/**
 * Checks if a message is generic
 */
function isGenericMessage(message: string): boolean {
  const genericMessages = [
    "The requested action was forbidden",
    "An error occurred",
    "Bad Request",
    "Unauthorized",
    "Forbidden",
    "Not Found",
    "Internal Server Error",
  ];

  return genericMessages.includes(message);
}

/**
 * Checks if the error requires a redirect
 */
export function shouldRedirect(error: unknown): boolean {
  const kratosError = extractKratosError(error);
  return !!kratosError?.redirectTo;
}

/**
 * Handles Kratos error with automatic redirect if needed
 */
export function handleKratosError(
  error: unknown,
  router?: { push: (url: string) => void }
): boolean {
  const kratosError = extractKratosError(error);

  if (!kratosError) {
    return false;
  }

  if (kratosError.redirectTo) {
    if (router) {
      try {
        const url = new URL(kratosError.redirectTo);
        router.push(url.pathname + url.search);
      } catch {
        // If URL parsing fails, use the redirect as-is
        window.location.href = kratosError.redirectTo;
      }
    } else {
      window.location.href = kratosError.redirectTo;
    }
    return true;
  }

  return false;
}

/**
 * Checks if error matches a specific Kratos error ID
 */
export function isKratosErrorId(
  error: unknown,
  errorId: string | string[]
): boolean {
  const kratosError = extractKratosError(error);
  if (!kratosError?.id) return false;

  const ids = Array.isArray(errorId) ? errorId : [errorId];
  return ids.includes(kratosError.id);
}
