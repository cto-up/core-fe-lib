/**
 * Framework-agnostic AAL2 (Authenticator Assurance Level 2) Manager
 * Handles MFA verification logic without framework dependencies
 */

import type { IStateStore, Aal2VerificationState } from "./types/aal2.types";
import { kratosService, type KratosFlowNode } from "./kratos-service";
import type {
  TotpLoginFlowData,
  LookupSecretLoginFlowData,
} from "./kratos-service";

// Re-export types for consumers
export type { Aal2VerificationState, IStateStore } from "./types/aal2.types";

export class Aal2Manager {
  private verificationResolve: ((success: boolean) => void) | null = null;

  constructor(private store: IStateStore<Aal2VerificationState>) {}

  /**
   * Trigger AAL2 verification flow
   * Returns a promise that resolves when verification is complete
   */
  async triggerVerification(): Promise<boolean> {
    return new Promise((resolve) => {
      this.verificationResolve = resolve;
      this.store.setState({ show: true });
    });
  }

  /**
   * Resolve verification with success/failure
   */
  resolveVerification(success: boolean): void {
    this.store.setState({
      show: false,
      totpCode: "",
      lookupCode: "",
      error: "",
    });

    if (this.verificationResolve) {
      this.verificationResolve(success);
      this.verificationResolve = null;
    }
  }

  /**
   * Initialize AAL2 flow with Kratos
   */
  async initializeFlow(
    getMfaStatus: () => Promise<{
      totp_enabled: boolean;
      webauthn_enabled: boolean;
      recovery_codes_set: boolean;
    }>
  ): Promise<void> {
    try {
      const session = await kratosService.getSession();
      if (!session?.identity?.traits?.email) {
        throw new Error("No session or email found for AAL2 verification");
      }

      const userEmail = session.identity.traits.email;
      const mfaStatus = await getMfaStatus();

      const availableMethods: Array<"totp" | "webauthn" | "lookup_secret"> = [];
      if (mfaStatus.totp_enabled) availableMethods.push("totp");
      if (mfaStatus.webauthn_enabled) availableMethods.push("webauthn");
      if (mfaStatus.recovery_codes_set) availableMethods.push("lookup_secret");

      if (availableMethods.length === 0) {
        throw new Error("No MFA methods available for AAL2 verification");
      }

      const flow = await kratosService.initAal2UpgradeFlow();

      let csrfToken = "";
      let flowIdentifier = userEmail;

      flow.ui?.nodes?.forEach((node: KratosFlowNode) => {
        if (node.attributes?.name === "csrf_token") {
          csrfToken = String(node.attributes.value || "");
        } else if (node.attributes?.name === "identifier") {
          flowIdentifier = String(node.attributes.value || flowIdentifier);
        }
      });

      let webauthnChallenge: string | undefined;
      if (availableMethods.includes("webauthn")) {
        const webauthnNode = flow.ui?.nodes?.find(
          (node: KratosFlowNode) =>
            node.attributes?.name === "webauthn_login_trigger"
        );
        if (webauthnNode?.attributes?.value) {
          webauthnChallenge = String(webauthnNode.attributes.value);
        }
      }

      this.store.setState({
        flowId: flow.id,
        csrfToken,
        availableMethods,
        selectedMethod: availableMethods[0],
        totpCode: "",
        lookupCode: "",
        error: "",
        loading: false,
        userEmail: flowIdentifier,
        identityId: session.identity.id,
        webauthnChallenge,
      });
    } catch (error) {
      console.error("Failed to initialize AAL2 flow:", error);
      throw error;
    }
  }

  /**
   * Submit TOTP code for verification
   */
  async submitTotp(): Promise<void> {
    const state = this.store.getState();

    if (!state.flowId || !state.totpCode) {
      throw new Error("Missing flow ID or TOTP code");
    }

    this.store.setState({ loading: true, error: "" });

    try {
      const totpData: TotpLoginFlowData = {
        method: "totp",
        csrf_token: state.csrfToken,
        identifier: state.userEmail || "",
        totp_code: state.totpCode,
      };

      await kratosService.submitLoginFlow(state.flowId, totpData);
      this.resolveVerification(true);
    } catch (error) {
      this.store.setState({ error: "Invalid code. Please try again." });
      throw error;
    } finally {
      this.store.setState({ loading: false });
    }
  }

  /**
   * Submit lookup/recovery code for verification
   */
  async submitLookup(): Promise<void> {
    const state = this.store.getState();

    if (!state.flowId || !state.lookupCode) {
      throw new Error("Missing flow ID or lookup code");
    }

    this.store.setState({ loading: true, error: "" });

    try {
      const lookupData: LookupSecretLoginFlowData = {
        method: "lookup_secret",
        csrf_token: state.csrfToken,
        identifier: state.userEmail || "",
        lookup_secret: state.lookupCode,
      };

      await kratosService.submitLoginFlow(state.flowId, lookupData);
      this.resolveVerification(true);
    } catch (error) {
      this.store.setState({ error: "Invalid code. Please try again." });
      throw error;
    } finally {
      this.store.setState({ loading: false });
    }
  }

  validateTotpInput(input: string): string {
    return input.replace(/\D/g, "").slice(0, 6);
  }

  validateLookupInput(input: string): string {
    return input.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  }

  switchMethod(method: "totp" | "webauthn" | "lookup_secret"): void {
    this.store.setState({
      selectedMethod: method,
      totpCode: "",
      lookupCode: "",
      error: "",
    });
  }

  reset(): void {
    this.store.setState({
      show: false,
      flowId: null,
      csrfToken: "",
      availableMethods: [],
      selectedMethod: null,
      totpCode: "",
      lookupCode: "",
      error: "",
      loading: false,
    });
  }
}
