/**
 * Standard Kratos error response (most common)
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
  error?: {
    id?: string;
    code?: number;
    status?: string;
    reason?: string;
    message?: string;
  };
}

export interface KratosUIMessage {
  id: number;
  text: string;
  type: "info" | "error" | "success";
  context?: Record<string, unknown>;
}

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
  label?: { id: number; text: string; type: string };
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
  title: { id: number; text: string; type: string };
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

export type KratosErrorResponse =
  | KratosStandardError
  | KratosGenericError
  | KratosFlowError
  | string
  | { message: string }
  | { error: string };

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
