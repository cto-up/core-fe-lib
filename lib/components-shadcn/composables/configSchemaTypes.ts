/**
 * Types for schema-driven config UIs (Tenant + Global config pages).
 * Hub ships its own schema arrays of these shapes — the lifted pages
 * receive them via a `:schema` prop.
 */

export type ConfigFieldType =
  | "text"
  | "boolean"
  | "enum"
  | "number"
  /**
   * Dynamic LLM dropdown backed by a registry fetcher (e.g. the hub's
   * pipeline LLM registry). The form renders an LLMSelect filtered by
   * `requiresCapability`. Use this rather than hardcoded `enum` options
   * whenever the value is an `llm_key`.
   */
  | "llm";

/**
 * Capability tag that drives which LLM registry rows appear in selectors
 * of type "llm". Mirrors the LLMCapability enum in any pipeline OpenAPI
 * schema — the consumer keeps the two in sync.
 */
export type LLMCapability =
  | "text"
  | "vision"
  | "ocr"
  | "layout"
  | "embedder"
  | "reasoning"
  | "code"
  | "audio"
  | "moderation";

export interface TenantConfigSchemaEntry {
  key: string;
  label: string;
  description: string;
  type: ConfigFieldType;
  options?: Array<{ value: string; label: string }>;
  /**
   * Only meaningful for `type: "llm"`. The capability filter passed to
   * the registry fetcher — only rows that advertise this capability
   * appear in the dropdown.
   */
  requiresCapability?: LLMCapability;
  /**
   * Only meaningful for `type: "llm"`. When set, the dropdown asks the
   * registry for per-(llm_key, taskType) feedback stats and renders
   * rating chips (reliability / formatting / userApproval) next to each
   * option. Match the backend handler `Type()`.
   */
  taskType?: string;
  defaultValue?: string;
  category: string;
}

export interface GlobalConfigSchemaEntry {
  key: string;
  label: string;
  description: string;
  type: ConfigFieldType;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string;
  category: string;
}

/**
 * Build an O(1) lookup map from any schema array.
 */
export function buildSchemaMap<T extends { key: string }>(
  schema: T[]
): Map<string, T> {
  return new Map(schema.map((e) => [e.key, e]));
}

/**
 * Extract the ordered unique category names from a schema array.
 */
export function extractCategories<T extends { category: string }>(
  schema: T[]
): string[] {
  return [...new Set(schema.map((e) => e.category))];
}
