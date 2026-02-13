/**
 * Ory Kratos Service
 *
 * This service provides methods to interact with Ory Kratos API
 * for authentication and identity management.
 */

import axios, { type AxiosInstance, type AxiosError } from "axios";
import { kratosConfig, KratosFlowType } from "@/config/kratos";

/** Extensible traits object for identity */
type TraitsRecord = Record<string, string | undefined>;

/** Metadata object for identity with predefined and custom fields */
type MetadataRecord = Record<string, unknown>;

/** Node attributes from Kratos flow UI */
type FlowNodeAttributes = Record<string, string | number | boolean | undefined>;

/** Error handler for axios requests */
type AxiosErrorResponse = AxiosError<{
  ui?: { messages?: Array<{ text: string }> };
  error?: { message?: string };
}>;

export interface KratosSession {
  id: string;
  active: boolean;
  expires_at: string;
  authenticated_at: string;
  identity: {
    id: string;
    schema_id: string;
    schema_url: string;
    state: string;
    state_changed_at: string;
    traits: TraitsRecord & {
      email: string;
      name?: string;
      subdomain?: string;
    };
    verifiable_addresses?: Array<{
      id: string;
      value: string;
      verified: boolean;
      via: string;
      status: string;
    }>;
    metadata_public?: MetadataRecord & {
      global_roles?: string[]; // Global roles (SUPER_ADMIN only)
      tenant_memberships?: Array<{
        tenant_id: string;
        roles: string[];
      }>;
    };
  };
}

export interface KratosFlowNode {
  type: string;
  group: string;
  attributes: FlowNodeAttributes;
  messages?: Array<{ id: number; text: string; type: string }>;
  meta?: { label?: { text: string } };
}

export interface KratosFlow {
  id: string;
  type: string;
  expires_at: string;
  issued_at: string;
  request_url: string;
  ui: {
    action: string;
    method: string;
    nodes: KratosFlowNode[];
    messages?: Array<{ id: number; text: string; type: string }>;
  };
}

export interface KratosIdentity {
  id: string;
  schema_id: string;
  traits: TraitsRecord & {
    email: string;
    name?: string;
    subdomain?: string;
  };
  metadata_public?: MetadataRecord & {
    global_roles?: string[]; // Global roles (SUPER_ADMIN only)
    tenant_memberships?: Array<{
      tenant_id: string;
      roles: string[];
    }>;
  };
}

/**
 * Generic response from Kratos flow submissions
 * Can be a KratosSession (success) or KratosFlow (with validation errors)
 */
export type KratosFlowResponse =
  | KratosSession
  | KratosFlow
  | Record<string, unknown>;

/**
 * Login Flow Data Types - Discriminated Union for Type-Safe Method-Specific Payloads
 */

/** Common fields required by all login methods */
interface BaseLoginFlowData {
  method: string;
  csrf_token: string;
  identifier: string;
}

/** Password-based authentication */
export interface PasswordLoginFlowData extends BaseLoginFlowData {
  method: "password";
  password: string;
}

/** TOTP (Time-based One-Time Password) authentication for AAL2 */
export interface TotpLoginFlowData extends BaseLoginFlowData {
  method: "totp";
  totp_code: string;
}

/** Recovery code (lookup_secret) authentication for AAL2 */
export interface LookupSecretLoginFlowData extends BaseLoginFlowData {
  method: "lookup_secret";
  lookup_secret: string;
}

/** WebAuthn authentication for AAL2 */
export interface WebAuthnLoginFlowData extends BaseLoginFlowData {
  method: "webauthn";
  webauthn_login: string;
}

/** Discriminated union: only one method type allowed per call */
export type LoginFlowData =
  | PasswordLoginFlowData
  | TotpLoginFlowData
  | LookupSecretLoginFlowData
  | WebAuthnLoginFlowData;

class KratosService {
  private readonly client: AxiosInstance;
  constructor() {
    const baseURL = kratosConfig.publicUrl;

    this.client = axios.create({
      baseURL: baseURL,
      withCredentials: true, // Important for session cookies
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("🔧 Kratos service initialized with baseURL:", baseURL);
  }

  /**
   * Get the current session
   * Returns null if not authenticated (401) - this is normal, not an error
   */
  async getSession(): Promise<KratosSession | null> {
    try {
      const response = await this.client.get("/sessions/whoami");
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      // 401 means not authenticated - this is expected, not an error
      if (axiosError.response?.status === 401) {
        console.log("ℹ️  No active session (401)");
        return null;
      }
      // Other errors should still throw
      console.error("❌ Error getting session:", error);
      throw error;
    }
  }

  /**
   * Initialize a login flow
   * IMPORTANT: This sets a CSRF cookie that must be sent with submitLoginFlow
   */
  async initLoginFlow(refresh = false, returnTo?: string): Promise<KratosFlow> {
    const params = new URLSearchParams();
    if (refresh) params.append("refresh", "true");
    if (returnTo) params.append("return_to", returnTo);

    const response = await this.client.get(
      `/self-service/login/browser?${params.toString()}`
    );

    console.log("🔐 Login flow initialized:", {
      flowId: response.data.id,
      refresh,
      setCookieHeaders: response.headers["set-cookie"],
      allHeaders: response.headers,
      hasCsrfToken: response.data.ui.nodes.some(
        (n: KratosFlowNode) => n.attributes?.name === "csrf_token"
      ),
    });

    // Log all cookies after flow init
    console.log("🍪 Cookies in document after flow init:", document.cookie);

    return response.data;
  }

  /**
   * Initialize an AAL2 upgrade flow
   * Used when a user needs to verify their second factor to perform privileged operations
   * IMPORTANT: User must already be authenticated at AAL1
   */
  async initAal2UpgradeFlow(returnTo?: string): Promise<KratosFlow> {
    const params = new URLSearchParams();
    params.append("aal", "aal2");
    params.append("refresh", "true");
    if (returnTo) params.append("return_to", returnTo);

    const response = await this.client.get(
      `/self-service/login/browser?${params.toString()}`
    );

    console.log("🔐 AAL2 upgrade flow initialized:", {
      flowId: response.data.id,
      aal: "aal2",
      refresh: true,
      nodes: response.data.ui.nodes.map((n: KratosFlowNode) => ({
        group: n.group,
        type: n.type,
        name: n.attributes?.name,
      })),
      messages: response.data.ui.messages,
    });

    return response.data;
  }

  /**
   * Submit login flow with type-safe method-specific data
   *
   * @param flowId - The login flow ID from initLoginFlow or initAal2UpgradeFlow
   * @param data - Login credentials with method-specific fields enforced by TypeScript
   *
   * @example
   * // Password authentication
   * submitLoginFlow(flowId, {
   *   method: "password",
   *   csrf_token: token,
   *   identifier: email,
   *   password: pwd
   * })
   *
   * // TOTP authentication
   * submitLoginFlow(flowId, {
   *   method: "totp",
   *   csrf_token: token,
   *   identifier: email,
   *   totp_code: code
   * })
   */
  async submitLoginFlow(
    flowId: string,
    data: LoginFlowData
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/login?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a registration flow
   */
  async initRegistrationFlow(returnTo?: string): Promise<KratosFlow> {
    const params = new URLSearchParams();
    if (returnTo) params.append("return_to", returnTo);

    const response = await this.client.get(
      `/self-service/registration/browser?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Submit registration flow
   */
  async submitRegistrationFlow(
    flowId: string,
    data: {
      traits: { email: string; name?: string };
      password: string;
      method: string;
      csrf_token?: string; // CSRF token from flow UI
    }
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/registration?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a recovery (password reset) flow
   */
  async initRecoveryFlow(): Promise<KratosFlow> {
    const response = await this.client.get("/self-service/recovery/browser");
    return response.data;
  }

  /**
   * Submit recovery flow
   */
  async submitRecoveryFlow(
    flowId: string,
    data: {
      email: string;
      method: string;
      csrf_token?: string; // CSRF token from flow UI
    }
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/recovery?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a settings flow (for profile updates)
   */
  async initSettingsFlow(): Promise<KratosFlow> {
    const response = await this.client.get("/self-service/settings/browser");
    return response.data;
  }

  /**
   * Submit settings flow
   */
  async submitSettingsFlow(
    flowId: string,
    data: Record<string, unknown>
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/settings?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Initialize a verification flow
   */
  async initVerificationFlow(): Promise<KratosFlow> {
    const response = await this.client.get(
      "/self-service/verification/browser"
    );
    return response.data;
  }

  /**
   * Submit verification flow
   */
  async submitVerificationFlow(
    flowId: string,
    data: { email: string; method: string }
  ): Promise<KratosFlowResponse> {
    const response = await this.client.post(
      `/self-service/verification?flow=${flowId}`,
      data
    );
    return response.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Get logout flow
      const response = await this.client.get("/self-service/logout/browser");
      const logoutToken = response.data.logout_token;

      // Submit logout
      await this.client.get(`/self-service/logout?token=${logoutToken}`);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  /**
   * Get flow by ID (useful for handling redirects)
   */
  async getFlow(flowType: KratosFlowType, flowId: string): Promise<KratosFlow> {
    const response = await this.client.get(
      `/self-service/${flowType}/flows?id=${flowId}`
    );
    return response.data;
  }

  /**
   * Get MFA status for current user
   */
  async getMFAStatus(): Promise<{
    totp_enabled: boolean;
    webauthn_enabled: boolean;
    recovery_codes_set: boolean;
    available_methods: string[];
    aal: string;
  }> {
    const response = await this.client.get("/sessions/whoami");
    const session = response.data;

    const status = {
      totp_enabled: false,
      webauthn_enabled: false,
      recovery_codes_set: false,
      available_methods: ["totp", "webauthn", "lookup_secret"],
      aal: session.authenticator_assurance_level || "aal1",
    };

    // Check credentials
    if (session.identity?.credentials?.totp?.config) {
      status.totp_enabled = true;
    }

    if (
      session.identity?.credentials?.webauthn?.config?.credentials?.length > 0
    ) {
      status.webauthn_enabled = true;
    }

    if (session.identity?.credentials?.lookup_secret?.config) {
      status.recovery_codes_set = true;
    }

    return status;
  }

  /**
   * Submit settings flow with method-specific data
   * IMPORTANT: Only submit method-specific fields to avoid schema validation errors
   */
  async submitSettingsMethod(
    flowId: string,
    method: string,
    data: Record<string, unknown>
  ): Promise<KratosFlowResponse> {
    // Only include the method and the provided data fields
    // Do NOT include other flow fields like traits, profile, etc.
    const payload: Record<string, unknown> = {
      method,
    };

    // Add only the specific fields for this method
    Object.keys(data).forEach((key) => {
      payload[key] = data[key];
    });

    console.log("📤 Submitting settings method:", {
      flowId,
      method,
      payload,
    });

    const response = await this.client.post(
      `/self-service/settings?flow=${flowId}`,
      payload
    );
    return response.data;
  }
}

export const kratosService = new KratosService();
