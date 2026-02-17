/**
 * Kratos error processing utilities (framework-agnostic)
 *
 * The handleAal2Error function takes an aal2Store parameter
 * so this module has zero framework dependencies.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  ParsedKratosError,
  KratosUIMessage,
  KratosValidationError,
  KratosStandardError,
  KratosGenericError,
  KratosFlowError,
} from "./types/kratos-errors";

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
 * Check if an error is an AAL2 requirement
 */
export function isAal2Required(error: unknown): boolean {
  const kratosError = extractKratosError(error);
  return (
    kratosError?.id === KratosErrorIds.SESSION_AAL2_REQUIRED ||
    (kratosError?.message?.includes("Authenticator Assurance Level") ?? false)
  );
}

/** Minimal interface for the AAL2 store needed by handleAal2Error */
interface Aal2StoreForInterceptor {
  state: { show: boolean };
  triggerVerification: () => Promise<boolean>;
}

/**
 * Handle AAL2 errors automatically in axios interceptor.
 * Takes the aal2Store as a parameter to stay framework-agnostic.
 */
export async function handleAal2Error(
  error: AxiosError,
  originalRequest: InternalAxiosRequestConfig & { _aal2Retry?: boolean },
  aal2Store: Aal2StoreForInterceptor
): Promise<unknown> {
  if (!isAal2Required(error)) {
    return Promise.reject(error);
  }

  if (originalRequest._aal2Retry) {
    console.error("❌ AAL2 verification already attempted, failing request");
    return Promise.reject(error);
  }

  if (aal2Store.state.show) {
    console.log("⏳ AAL2 verification already in progress, waiting...");
    const verified = await new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!aal2Store.state.show) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });

    if (!verified) {
      return Promise.reject(error);
    }
  } else {
    console.log("🔐 AAL2 required, prompting user for verification...");

    try {
      const verified = await aal2Store.triggerVerification();

      if (!verified) {
        console.log("❌ AAL2 verification cancelled by user");
        return Promise.reject(error);
      }

      console.log("✅ AAL2 verified, retrying original request...");
    } catch (verificationError) {
      console.error("❌ AAL2 verification failed:", verificationError);
      return Promise.reject(error);
    }
  }

  originalRequest._aal2Retry = true;
  return axios(originalRequest);
}

/**
 * Extracts Kratos error information from an Axios error response
 * Handles multiple error response formats from Kratos
 */
export function extractKratosError(error: unknown): ParsedKratosError | null {
  if (!isAxiosError(error)) {
    console.log(JSON.stringify(error));

    const anyError = error as Record<string, Record<string, unknown>> | null;
    const newError = {
      id: anyError?.body?.code || "unknown_error",
      status: (anyError as Record<string, unknown>)?.status,
      reason: "",
      message: anyError?.body?.message || "Network error",
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

  if (typeof data === "string") {
    return {
      code: status,
      status: statusText,
      reason: data,
      message: data,
    };
  }

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

  if (isGenericError(data)) {
    return {
      code: data.error.code || status,
      status: data.error.status || statusText,
      reason: data.error.reason || data.error.message,
      message: data.error.message,
    };
  }

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

  const anyData = data as Record<string, unknown>;

  if (anyData.message && typeof anyData.message === "string") {
    return {
      id: anyData.code as string | undefined,
      code: status,
      status: statusText,
      reason: anyData.message,
      message: anyData.message,
    };
  }

  if (anyData.error && typeof anyData.error === "string") {
    return {
      id: anyData.code as string | undefined,
      code: status,
      status: statusText,
      reason: anyData.error,
      message: anyData.error,
    };
  }

  return {
    id: anyData.code as string | undefined,
    code: status,
    status: statusText,
    reason: "An unknown error occurred",
    message: JSON.stringify(data),
  };
}

/**
 * Type guards for different error formats
 */
function isStandardError(data: unknown): data is KratosStandardError {
  const d = data as Record<string, unknown>;
  return (
    !!d.error &&
    typeof d.error === "object" &&
    "message" in (d.error as Record<string, unknown>) &&
    ("id" in (d.error as Record<string, unknown>) ||
      "code" in (d.error as Record<string, unknown>))
  );
}

function isGenericError(data: unknown): data is KratosGenericError {
  const d = data as Record<string, unknown>;
  return (
    !!d.error &&
    typeof d.error === "object" &&
    "message" in (d.error as Record<string, unknown>) &&
    !("id" in (d.error as Record<string, unknown>))
  );
}

function isFlowError(data: unknown): data is KratosFlowError {
  const d = data as Record<string, unknown>;
  return (
    !!d.id &&
    !!d.type &&
    !!d.ui &&
    typeof d.ui === "object" &&
    Array.isArray((d.ui as Record<string, unknown>).nodes)
  );
}

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Extracts UI messages from Kratos flow response
 */
function extractUIMessages(data: KratosFlowError): KratosUIMessage[] {
  const messages: KratosUIMessage[] = [];

  if (data.ui?.messages && Array.isArray(data.ui.messages)) {
    messages.push(...data.ui.messages);
  }

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
function extractValidationErrorsFromFlow(
  data: KratosFlowError
): KratosValidationError[] {
  const validationErrors: KratosValidationError[] = [];

  if (data.ui?.nodes && Array.isArray(data.ui.nodes)) {
    for (const node of data.ui.nodes) {
      if (node.messages && node.messages.length > 0) {
        const fieldName =
          (node.attributes as unknown as Record<string, unknown>)?.name ||
          "unknown";
        const errorMessages = node.messages.filter(
          (msg: KratosUIMessage) => msg.type === "error"
        );

        if (errorMessages.length > 0) {
          validationErrors.push({
            field: String(fieldName),
            messages: errorMessages,
          });
        }
      }
    }
  }

  return validationErrors;
}

function getReasonFromUIMessages(messages?: KratosUIMessage[]): string {
  if (!messages || messages.length === 0) {
    return "An error occurred";
  }
  const errorMessage = messages.find((msg) => msg.type === "error");
  return errorMessage?.text || messages[0].text || "An error occurred";
}

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
 * Extracts validation errors - handles all error formats
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

  if (
    kratosError.reason &&
    kratosError.reason !== kratosError.message &&
    isGenericMessage(kratosError.message)
  ) {
    return kratosError.reason;
  }

  return kratosError.message || kratosError.reason || "An error occurred";
}

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
        globalThis.location.href = kratosError.redirectTo;
      }
    } else {
      globalThis.location.href = kratosError.redirectTo;
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
