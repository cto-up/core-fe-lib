// types/kratos.ts

/**
 * Standard Kratos error response (most common)
 * Used for authentication/authorization errors, session issues, etc.
 */
export interface KratosStandardError {
  error: {
    id: string;
    code: number;
    status: string;
    reason: string;
    message: string;
    details?: Record<string, unknown>;
  };
  redirect_browser_to?: string;
}

/**
 * Generic error response (simpler format)
 * Sometimes used for basic errors
 */
export interface KratosGenericError {
  error: {
    code: number;
    status: string;
    message: string;
    reason?: string;
  };
}

/**
 * Flow error with UI messages
 * Used in login, registration, settings, recovery, verification flows
 */
export interface KratosFlowError {
  id: string;
  type: string;
  expires_at: string;
  issued_at: string;
  request_url: string;
  ui: {
    action: string;
    method: string;
    messages?: KratosUIMessage[];
    nodes: KratosUINode[];
  };
  // Error might be embedded here or separate
  error?: {
    id?: string;
    code?: number;
    status?: string;
    reason?: string;
    message?: string;
  };
}

/**
 * UI Message structure
 */
export interface KratosUIMessage {
  id: number;
  text: string;
  type: "info" | "error" | "success";
  context?: Record<string, unknown>;
}

/**
 * UI Node structure (for form fields)
 */
export interface KratosUINode {
  type: "input" | "img" | "a" | "script" | "text";
  group: string;
  attributes: KratosNodeAttributes;
  messages?: KratosUIMessage[];
  meta?: {
    label?: {
      id: number;
      text: string;
      type: string;
    };
  };
}

/**
 * Settings Flow UI Node - used in MFA setup flows
 */
export interface SettingsFlowNode {
  type: "input" | "img" | "a" | "script" | "text";
  group: string;
  attributes: Record<string, unknown>;
  messages?: KratosUIMessage[];
  meta?: Record<string, unknown>;
}

export type KratosNodeAttributes =
  | KratosInputAttributes
  | KratosImageAttributes
  | KratosAnchorAttributes
  | KratosTextAttributes
  | KratosScriptAttributes;

export interface KratosInputAttributes {
  name: string;
  type: string;
  value?: unknown;
  required?: boolean;
  disabled?: boolean;
  node_type: "input";
  label?: {
    id: number;
    text: string;
    type: string;
  };
  pattern?: string;
  autocomplete?: string;
}

export interface KratosImageAttributes {
  src: string;
  id: string;
  width: number;
  height: number;
  node_type: "img";
}

export interface KratosAnchorAttributes {
  href: string;
  title: {
    id: number;
    text: string;
    type: string;
  };
  id: string;
  node_type: "a";
}

export interface KratosTextAttributes {
  text: {
    id: number;
    text: string;
    type: string;
    context?: Record<string, unknown>;
  };
  id: string;
  node_type: "text";
}

export interface KratosScriptAttributes {
  src: string;
  async: boolean;
  referrerpolicy: string;
  crossorigin: string;
  integrity: string;
  type: string;
  id: string;
  node_type: "script";
}

/**
 * Union type for all possible Kratos error formats
 */
export type KratosErrorResponse =
  | KratosStandardError
  | KratosGenericError
  | KratosFlowError
  | string
  | { message: string } // Sometimes just { message: "error" }
  | { error: string }; // Sometimes { error: "description" }

/**
 * Normalized error structure after parsing
 */
export interface ParsedKratosError {
  id?: string;
  code: number;
  status: string;
  reason: string;
  message: string;
  redirectTo?: string;
  uiMessages?: KratosUIMessage[];
  validationErrors?: KratosValidationError[];
  details?: Record<string, unknown>;
  flowId?: string;
}

export interface KratosValidationError {
  field: string;
  messages: KratosUIMessage[];
}
