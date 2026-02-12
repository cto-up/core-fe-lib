import { ref, onMounted, inject } from "vue";
import { useI18n } from "vue-i18n";
import { MfaService } from "core-fe-lib/openapi/core";
import { kratosService } from "../services/kratos.service";
import {
  notificationServiceKey,
  dialogServiceKey,
} from "../../plugins/injection-keys";
import { getUserFriendlyMessage } from "../utils/kratos-error-processor";
import type { SettingsFlowNode } from "../types/kratos-errors";
import {
  extractRecoveryCodes,
  getSecretFromFlow,
} from "../utils/kratos-flow-helpers";

/**
 * Type for nodes returned from settings flow/response
 */
interface FlowNode extends SettingsFlowNode {
  attributes: {
    name?: string;
    value?: unknown;
    [key: string]: unknown;
  };
}

/**
 * Helper function to find a node by attribute name
 */
function findNodeByName(
  nodes: FlowNode[] | undefined,
  name: string
): FlowNode | undefined {
  if (!nodes) return undefined;
  return nodes.find((node) => node.attributes?.name === name);
}

/**
 * Helper function to find nodes by group
 */
function findNodesByGroup(
  nodes: FlowNode[] | undefined,
  group: string
): FlowNode[] {
  if (!nodes) return [];
  return nodes.filter((node) => node.group === group);
}

/**
 * Helper function to find a node by group and type
 */
function findNodeByGroupAndType(
  nodes: FlowNode[] | undefined,
  group: string,
  type: string
): FlowNode | undefined {
  if (!nodes) return undefined;
  return nodes.find((node) => node.group === group && node.type === type);
}

/**
 * Helper function to convert ArrayBuffer to base64url
 */
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  // Convert base64 to base64url (RFC 4648)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Helper function to convert base64url to ArrayBuffer
 */

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = base64 + padding;

  // Decode base64 to binary string
  const binaryString = window.atob(base64Padded);

  // Convert binary string to ArrayBuffer
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useMfa() {
  const { t } = useI18n();
  const notifications = inject(notificationServiceKey);
  const dialog = inject(dialogServiceKey);

  if (!notifications) {
    throw new Error(
      "NotificationService not provided. Ensure the UI services are provided at the app level."
    );
  }
  if (!dialog) {
    throw new Error(
      "DialogService not provided. Ensure the UI services are provided at the app level."
    );
  }

  const loading = ref(true);

  const mfaStatus = ref({
    totp_enabled: false,
    webauthn_enabled: false,
    recovery_codes_set: false,
    available_methods: [] as string[],
    aal: "aal1",
  });

  const showTOTPSetup = ref(false);
  const totpSetupStep = ref<"qr" | "verify" | "recovery">("qr");
  const totpQRCode = ref("");
  const totpSecretKey = ref("");
  const totpCode = ref("");
  const totpError = ref("");
  const settingsFlowId = ref<string | undefined>();
  const csrfToken = ref<string>("");

  const showRecoveryCodes = ref(false);
  const recoveryCodes = ref<string[]>([]);
  const recoveryCodesInteracted = ref(false);

  onMounted(async () => {
    // Check if we need to refresh the session for MFA setup
    // This ensures the session is fresh enough for privileged operations
    const urlParams = new URLSearchParams(globalThis.location.search);
    const needsRefresh = urlParams.get("refresh");

    if (needsRefresh === "true") {
      // User just re-authenticated, remove the query param
      globalThis.history.replaceState({}, "", globalThis.location.pathname);
    }

    await loadMFAStatus();
  });

  async function loadMFAStatus() {
    try {
      loading.value = true;
      // Use our backend API instead of Kratos directly
      const status = await MfaService.getMfaStatus();
      mfaStatus.value = status;

      console.log("📊 MFA Status loaded:", {
        totp_enabled: status.totp_enabled,
        webauthn_enabled: status.webauthn_enabled,
        recovery_codes_set: status.recovery_codes_set,
        aal: status.aal,
      });
    } catch (error) {
      console.error("Failed to load MFA status:", error);

      notifications.error(
        t("core.mfa.notifications.loadError"),
        getUserFriendlyMessage(error) ?? t("core.mfa.notifications.loadError")
      );
    } finally {
      loading.value = false;
    }
  }

  async function setupTOTP() {
    try {
      // Initialize settings flow through our backend
      const flow = await MfaService.initializeSettingsFlow();

      if (!flow.id) {
        throw new Error("Invalid flow: missing flow ID");
      }

      settingsFlowId.value = flow.id;

      const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

      console.log("🔍 Settings flow initialized:", {
        flowId: flow.id,
        nodes: flowNodes.map((n: FlowNode) => ({
          type: n.type,
          group: n.group,
          name: n.attributes?.name,
          nodeType: (n.attributes as Record<string, unknown>)?.node_type,
        })),
      });

      // Check if TOTP is already enabled (totp_unlink button present)
      const totpUnlinkNode = findNodeByName(flowNodes, "totp_unlink");

      if (totpUnlinkNode) {
        // TOTP is already enabled
        notifications.error(
          t("core.mfa.notifications.totpAlreadyEnabled"),
          t("core.mfa.notifications.totpAlreadyEnabledDesc")
        );
        // Refresh status to ensure UI is in sync
        await loadMFAStatus();
        return;
      }

      // Extract CSRF token from the flow
      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      if (csrfNode?.attributes?.value) {
        csrfToken.value = csrfNode.attributes.value as string;
      }

      // Find TOTP node in flow - it's an img node with the QR code
      const totpNode = findNodeByGroupAndType(flowNodes, "totp", "img");

      if (totpNode?.attributes?.src) {
        // The QR code is a base64 image
        totpQRCode.value = `<img src="${totpNode.attributes.src}" alt="QR Code" class="mx-auto" />`;

        // Try to extract the secret key from the flow
        const secret = await getSecretFromFlow(flow);
        totpSecretKey.value =
          secret || "Scan QR code with your authenticator app";
      } else {
        // No QR code found - this shouldn't happen if totp_unlink wasn't present
        console.error("❌ No TOTP QR code found in flow");
        notifications.error(
          t("core.mfa.notifications.totpSetupError"),
          "No QR code available. Please try again or contact support."
        );
        return;
      }

      showTOTPSetup.value = true;
      totpSetupStep.value = "qr";
    } catch (error: unknown) {
      console.error("❌ Failed to setup TOTP:", error);
      notifications.error(
        t("core.mfa.notifications.totpSetupError"),
        getUserFriendlyMessage(error) ??
          t("core.mfa.notifications.totpSetupError")
      );
    }
  }

  function validateTOTPInput() {
    totpCode.value = totpCode.value.replace(/\D/g, "").slice(0, 6);
    totpError.value = "";
  }

  async function verifyTOTP() {
    try {
      if (!settingsFlowId.value) return;

      console.log("🔐 Verifying TOTP:", {
        flowId: settingsFlowId.value,
        totpCode: totpCode.value,
        csrfToken: csrfToken.value ? "present" : "missing",
      });

      await kratosService.submitSettingsMethod(settingsFlowId.value, "totp", {
        totp_code: totpCode.value,
        csrf_token: csrfToken.value,
      });

      // TOTP verified successfully - now move to recovery codes stage
      console.log("✅ TOTP verified, generating recovery codes...");

      // Generate recovery codes immediately
      await generateRecoveryCodesForSetup();

      // Move to recovery stage (don't close modal)
      totpSetupStep.value = "recovery";
      totpCode.value = "";
      totpError.value = "";
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: {
            id?: string;
            ui?: {
              nodes?: FlowNode[];
            };
          };
        };
      } | null;

      console.error("❌ TOTP verification failed:", {
        status: axiosError?.response?.status,
        statusText: axiosError?.response?.statusText,
        data: axiosError?.response?.data,
        error,
      });

      // Check if it's a validation error with a new flow
      if (
        axiosError?.response?.status === 400 &&
        axiosError.response?.data?.id
      ) {
        const newFlow = axiosError.response.data;
        const newFlowNodes =
          (newFlow.ui?.nodes as FlowNode[] | undefined) || [];

        // Check if it's the roles validation error
        const hasRolesError = newFlowNodes.some((node: FlowNode) =>
          node.messages?.some((msg) =>
            msg.text?.includes('additionalProperties "roles" not allowed')
          )
        );

        if (hasRolesError) {
          notifications.error(
            "Configuration Error",
            "Your identity schema includes 'roles' in traits. Please contact support to fix your Kratos identity schema."
          );
          return;
        }

        // Update flow ID and CSRF token from the error response
        settingsFlowId.value = newFlow.id;
        const newCsrfNode = findNodeByName(newFlowNodes, "csrf_token");
        if (newCsrfNode?.attributes?.value) {
          csrfToken.value = newCsrfNode.attributes.value as string;
          console.log("🔄 Updated CSRF token from error response");
        }
      }

      if (error) {
        notifications.error(
          "Re-authentication Required",
          getUserFriendlyMessage(error) ?? String(error)
        );
        return;
      }

      totpError.value = t("core.mfa.setup.totp.invalidCode");
      console.error("TOTP verification failed:", error);
    }
  }

  function cancelTOTPSetup() {
    showTOTPSetup.value = false;
    totpCode.value = "";
    totpError.value = "";
    totpSetupStep.value = "qr";
    recoveryCodesInteracted.value = false;
    recoveryCodes.value = [];
  }

  async function generateRecoveryCodesForSetup() {
    try {
      // Initialize a new settings flow for recovery codes
      const flow = await MfaService.initializeSettingsFlow();

      const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

      // Extract CSRF token
      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      const csrf = (csrfNode?.attributes?.value as string) || "";

      console.log("🔑 Generating recovery codes with flow:", flow.id);

      // First, regenerate the codes
      const response = await kratosService.submitSettingsMethod(
        flow.id || "",
        "lookup_secret",
        {
          lookup_secret_regenerate: true,
          csrf_token: csrf,
        }
      );

      console.log("✅ Recovery codes generated:", response);

      // Extract the codes from the response
      recoveryCodes.value = extractRecoveryCodes(response);

      if (recoveryCodes.value.length === 0) {
        throw new Error("No recovery codes returned from Kratos");
      }

      // Store the new flow ID and CSRF for the confirmation step
      const responseData = response as Record<string, unknown>;
      const responseId = responseData.id;
      if (typeof responseId === "string") {
        settingsFlowId.value = responseId;
      }

      const responseUINodes = (
        responseData.ui && typeof responseData.ui === "object"
          ? (responseData.ui as Record<string, unknown>).nodes
          : undefined
      ) as FlowNode[] | undefined;

      const newCsrfNode = findNodeByName(responseUINodes, "csrf_token");
      if (newCsrfNode?.attributes?.value) {
        csrfToken.value = newCsrfNode.attributes.value as string;
      }
    } catch (error: unknown) {
      console.error("❌ Failed to generate recovery codes:", error);
      notifications.error(
        t("core.mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ??
          t("core.mfa.notifications.recoveryError")
      );
      // Fall back to closing the modal
      showTOTPSetup.value = false;
    }
  }

  async function confirmRecoveryCodesAndFinish() {
    try {
      if (!settingsFlowId.value) {
        throw new Error("No settings flow ID available");
      }

      console.log(
        "✅ Confirming recovery codes with flow:",
        settingsFlowId.value
      );

      // Confirm the recovery codes
      await kratosService.submitSettingsMethod(
        settingsFlowId.value,
        "lookup_secret",
        {
          lookup_secret_confirm: true,
          csrf_token: csrfToken.value,
        }
      );

      console.log("🎉 Recovery codes confirmed, TOTP setup complete!");

      // Close modal and refresh status
      showTOTPSetup.value = false;
      totpSetupStep.value = "qr";
      recoveryCodesInteracted.value = false;
      recoveryCodes.value = [];

      await loadMFAStatus();

      notifications.success(
        t("core.mfa.notifications.totpEnabled"),
        t("core.mfa.notifications.setupComplete")
      );
    } catch (error) {
      console.error("❌ Failed to confirm recovery codes:", error);

      // Check for the specific error message
      notifications.error(
        t("core.mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ?? t("core.mfa.notifications.setupError")
      );
    }
  }

  function handleCopyRecoveryCodes() {
    copyRecoveryCodes();
    recoveryCodesInteracted.value = true;
  }

  function handleDownloadRecoveryCodes() {
    downloadRecoveryCodes();
    recoveryCodesInteracted.value = true;
  }

  async function disableTOTP() {
    const confirmed = await dialog.confirm({
      title: t("core.mfa.confirmations.disableTotp"),
      message: t("core.mfa.confirmations.disableTotpDescription"),
      ok: t("actions.confirm"),
      cancel: t("actions.cancel"),
    });

    if (!confirmed) return;

    try {
      const flow = await MfaService.initializeSettingsFlow();

      const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

      // Extract CSRF token
      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      const csrf = (csrfNode?.attributes?.value as string) || "";

      await kratosService.submitSettingsMethod(flow.id || "", "totp", {
        totp_unlink: true,
        csrf_token: csrf,
      });

      await loadMFAStatus();
      notifications.success(
        t("core.mfa.notifications.totpDisabled"),
        t("core.mfa.notifications.totpDisabled")
      );
    } catch (error: unknown) {
      console.error("❌ Failed to disable TOTP:", error);
      notifications.error(
        t("core.mfa.notifications.totpDisableError"),
        getUserFriendlyMessage(error) ??
          t("core.mfa.notifications.totpDisableError")
      );
    }
  }

  async function setupWebAuthn() {
    try {
      const session = await kratosService.getSession();
      if (!session) {
        notifications.error(
          t("core.mfa.notifications.notAuthenticated"),
          "Please log in to set up WebAuthn"
        );
        return;
      }

      const flow = await MfaService.initializeSettingsFlow();

      const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

      console.log("🔍 Settings flow for WebAuthn:", {
        flowId: flow.id,
        allNodes: flowNodes.map((n: FlowNode) => ({
          type: n.type,
          group: n.group,
          name: n.attributes?.name,
          nodeType: (n.attributes as Record<string, unknown>)?.node_type,
        })),
        action: (flow.ui as Record<string, unknown> | undefined)?.action,
        method: (flow.ui as Record<string, unknown> | undefined)?.method,
      });

      // Check what groups are available in the flow
      const availableGroups = new Set(
        flowNodes.map((n: FlowNode) => n.group).filter(Boolean)
      );
      console.log("📋 Available groups in flow:", Array.from(availableGroups));

      // Check if WebAuthn nodes are present in the flow
      const webauthnNodes = findNodesByGroup(flowNodes, "webauthn");

      console.log(
        "🔑 WebAuthn nodes found:",
        webauthnNodes.length,
        webauthnNodes.map((n: FlowNode) => ({
          type: n.type,
          name: n.attributes?.name,
          value: n.attributes?.value,
          disabled: (n.attributes as Record<string, unknown>)?.disabled,
          required: (n.attributes as Record<string, unknown>)?.required,
          onclick: (n.attributes as Record<string, unknown>)?.onclick
            ? "present"
            : "missing",
        }))
      );

      if (!webauthnNodes || webauthnNodes.length === 0) {
        console.error("❌ No WebAuthn nodes in settings flow");
        console.error("Available groups:", Array.from(availableGroups));
        notifications.error(
          t("core.mfa.notifications.webauthnError"),
          "WebAuthn is not available in this settings flow. Please refresh and try again."
        );
        return;
      }

      // Extract CSRF token
      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      const csrf = (csrfNode?.attributes?.value as string) || "";

      if (!csrf) {
        console.error("❌ No CSRF token found in flow");
        notifications.error(
          t("core.mfa.notifications.webauthnError"),
          "Missing CSRF token. Please refresh and try again."
        );
        return;
      }

      // Get user email from session/identity
      let displayName = "Security Key";
      const email = (
        session?.identity?.traits as Record<string, unknown> | undefined
      )?.email;
      if (email) {
        displayName = email as string;
      }

      console.log(
        "🔐 Starting WebAuthn registration with display name:",
        displayName
      );

      // Step 1: Extract the WebAuthn challenge from the trigger button
      // The challenge is already present in the flow's webauthn_register_trigger node
      const triggerNode = findNodeByName(
        flowNodes,
        "webauthn_register_trigger"
      );

      if (!triggerNode?.attributes?.value) {
        console.error("❌ No WebAuthn challenge found in trigger node");
        notifications.error(
          t("core.mfa.notifications.webauthnError"),
          "WebAuthn challenge not found. Please refresh and try again."
        );
        return;
      }

      // Parse the challenge from the trigger button's value
      const publicKeyOptions = JSON.parse(String(triggerNode.attributes.value));
      console.log(
        "🔑 Extracted publicKey options from trigger:",
        publicKeyOptions
      );

      // Convert base64url strings to ArrayBuffers for WebAuthn API
      interface PublicKeyCredentialCreationOptionsExt extends Omit<
        PublicKeyCredentialCreationOptions,
        "challenge" | "user" | "excludeCredentials"
      > {
        challenge: ArrayBuffer;
        user: Omit<PublicKeyCredentialCreationOptions["user"], "id"> & {
          id: ArrayBuffer;
        };
        excludeCredentials?: Array<
          Omit<PublicKeyCredentialDescriptor, "id"> & { id: ArrayBuffer }
        >;
      }

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptionsExt =
        {
          ...publicKeyOptions.publicKey,
          challenge: base64urlToArrayBuffer(
            publicKeyOptions.publicKey.challenge
          ),
          user: {
            ...publicKeyOptions.publicKey.user,
            id: base64urlToArrayBuffer(publicKeyOptions.publicKey.user.id),
          },
          excludeCredentials:
            publicKeyOptions.publicKey.excludeCredentials?.map(
              (cred: Record<string, unknown>) => ({
                ...cred,
                id: base64urlToArrayBuffer(cred.id as string),
              })
            ) || [],
        };

      console.log("🔐 Calling browser WebAuthn API...");

      // Step 2: Call the browser's WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey:
          publicKeyCredentialCreationOptions as PublicKeyCredentialCreationOptions,
      });

      if (!credential) {
        throw new Error("WebAuthn credential creation was cancelled");
      }

      console.log("✅ WebAuthn credential created:", credential);

      // Step 3: Format the credential response for Kratos
      const credentialResponse = credential as PublicKeyCredential;
      const response =
        credentialResponse.response as AuthenticatorAttestationResponse;

      const credentialData = {
        id: credentialResponse.id,
        rawId: arrayBufferToBase64url(credentialResponse.rawId),
        type: credentialResponse.type,
        response: {
          attestationObject: arrayBufferToBase64url(response.attestationObject),
          clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
        },
      };

      console.log("📤 Submitting credential data to Kratos");

      // Step 4: Submit the credential back to Kratos
      await kratosService.submitSettingsMethod(flow.id || "", "webauthn", {
        webauthn_register: JSON.stringify(credentialData),
        webauthn_register_displayname: displayName,
        csrf_token: csrf,
      });

      await loadMFAStatus();
      notifications.success(
        t("core.mfa.notifications.webauthnEnabled"),
        t("core.mfa.notifications.webauthnEnabled")
      );
    } catch (error: unknown) {
      const webauthnError = error as {
        name?: string;
        message?: string;
        response?: { data?: unknown; status?: number };
      } | null;

      console.error("❌ WebAuthn setup failed:", error);
      console.error("Error details:", {
        message: webauthnError?.message,
        response: webauthnError?.response?.data,
        status: webauthnError?.response?.status,
      });

      // Handle specific WebAuthn errors
      if (webauthnError?.name === "NotAllowedError") {
        notifications.error(
          t("core.mfa.notifications.webauthnError"),
          "Security key registration was cancelled or timed out"
        );
      } else if (webauthnError?.name === "NotSupportedError") {
        notifications.error(
          t("core.mfa.notifications.webauthnError"),
          "WebAuthn is not supported by your browser"
        );
      } else {
        notifications.error(
          t("core.mfa.notifications.webauthnError"),
          getUserFriendlyMessage(error) ??
            t("core.mfa.notifications.webauthnError")
        );
      }
    }
  }

  async function disableWebAuthn() {
    const confirmed = await dialog.confirm({
      title: t("core.mfa.confirmations.disableWebauthn"),
      message: t("core.mfa.confirmations.disableWebauthnDescription"),
      ok: t("actions.confirm"),
      cancel: t("actions.cancel"),
    });

    if (!confirmed) return;

    try {
      // Use backend endpoint that calls Kratos Admin API to delete WebAuthn credentials
      await MfaService.disableWebAuthn();

      console.log("✅ WebAuthn disabled successfully via Admin API");

      await loadMFAStatus();
      notifications.success(
        t("core.mfa.notifications.webauthnDisabled"),
        t("core.mfa.notifications.webauthnDisabled")
      );
    } catch (error: unknown) {
      console.error("❌ Failed to disable WebAuthn:", error);

      notifications.error(
        t("core.mfa.notifications.webauthnDisableError"),
        getUserFriendlyMessage(error) ??
          t("core.mfa.notifications.webauthnDisableError")
      );
    }
  }

  async function generateRecoveryCodes() {
    try {
      const flow = await MfaService.initializeSettingsFlow();

      const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

      // Extract CSRF token
      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      const csrf = (csrfNode?.attributes?.value as string) || "";

      // Step 1: Regenerate the codes first
      const regenerateResponse = await kratosService.submitSettingsMethod(
        flow.id || "",
        "lookup_secret",
        {
          lookup_secret_regenerate: true,
          csrf_token: csrf,
        }
      );

      console.log("✅ Recovery codes regenerated:", regenerateResponse);

      // Extract the codes from the regenerate response
      recoveryCodes.value = extractRecoveryCodes(regenerateResponse);

      if (recoveryCodes.value.length === 0) {
        throw new Error("No recovery codes returned from Kratos");
      }

      // Store flow info for later confirmation (after user saves codes)
      const regenerateData = regenerateResponse as Record<string, unknown>;
      const regenerateId = regenerateData.id;
      if (typeof regenerateId === "string") {
        settingsFlowId.value = regenerateId;
      }

      const regenerateUINodes = (
        regenerateData.ui && typeof regenerateData.ui === "object"
          ? (regenerateData.ui as Record<string, unknown>).nodes
          : undefined
      ) as FlowNode[] | undefined;

      const newCsrfNode = findNodeByName(regenerateUINodes, "csrf_token");
      if (newCsrfNode?.attributes?.value) {
        csrfToken.value = newCsrfNode.attributes.value as string;
      }

      // Reset interaction flag and show modal
      recoveryCodesInteracted.value = false;
      showRecoveryCodes.value = true;

      // Note: Codes are NOT confirmed yet - user must click "I Have Saved These Codes"
    } catch (error: unknown) {
      console.error("Failed to generate recovery codes:", error);

      notifications.error(
        t("core.mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ??
          t("core.mfa.notifications.recoveryError")
      );
    }
  }

  function downloadRecoveryCodes() {
    const content = recoveryCodes.value.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-codes.txt";
    a.click();
    globalThis.URL.revokeObjectURL(url);
  }

  async function copyRecoveryCodes() {
    const content = recoveryCodes.value.join("\n");
    await navigator.clipboard.writeText(content);
    notifications.success(
      t("core.mfa.notifications.recoveryCopied"),
      t("core.mfa.notifications.recoveryCopied")
    );
  }

  // Handlers for standalone recovery codes modal (with forced interaction)
  function handleCopyRecoveryCodesStandalone() {
    copyRecoveryCodes();
    recoveryCodesInteracted.value = true;
  }

  function handleDownloadRecoveryCodesStandalone() {
    downloadRecoveryCodes();
    recoveryCodesInteracted.value = true;
  }

  async function confirmAndSaveRecoveryCodes() {
    try {
      if (!settingsFlowId.value) {
        throw new Error("No settings flow ID available");
      }

      console.log(
        "✅ Confirming and saving recovery codes with flow:",
        settingsFlowId.value
      );

      // Confirm the codes (this saves them to Kratos)
      await kratosService.submitSettingsMethod(
        settingsFlowId.value,
        "lookup_secret",
        {
          lookup_secret_confirm: true,
          csrf_token: csrfToken.value,
        }
      );

      console.log("🎉 Recovery codes confirmed and saved!");

      // Close modal and refresh status
      showRecoveryCodes.value = false;
      recoveryCodesInteracted.value = false;
      recoveryCodes.value = [];

      await loadMFAStatus();

      notifications.success(
        t("core.mfa.notifications.recoveryGenerated"),
        t("core.mfa.notifications.setupComplete")
      );
    } catch (error) {
      console.error("❌ Failed to confirm recovery codes:", error);
      notifications.error(
        t("core.mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ?? t("core.mfa.notifications.setupError")
      );
    }
  }

  async function cancelRecoveryCodesModal() {
    if (!recoveryCodesInteracted.value) {
      const confirmed = await dialog.confirm({
        title: t("core.mfa.confirmations.cancelRecoveryCodes"),
        message: t("core.mfa.confirmations.cancelRecoveryCodesDescription"),
        ok: t("actions.confirm"),
        cancel: t("actions.cancel"),
      });

      if (!confirmed) return;
    }
    closeRecoveryCodesModal();
  }

  function closeRecoveryCodesModal() {
    showRecoveryCodes.value = false;
    recoveryCodesInteracted.value = false;
    recoveryCodes.value = [];
  }

  return {
    t,
    loading,
    mfaStatus,
    showTOTPSetup,
    totpSetupStep,
    totpQRCode,
    totpSecretKey,
    totpCode,
    totpError,
    settingsFlowId,
    csrfToken,
    showRecoveryCodes,
    recoveryCodes,
    recoveryCodesInteracted,
    loadMFAStatus,
    setupTOTP,
    validateTOTPInput,
    verifyTOTP,
    cancelTOTPSetup,
    generateRecoveryCodesForSetup,
    confirmRecoveryCodesAndFinish,
    handleCopyRecoveryCodes,
    handleDownloadRecoveryCodes,
    disableTOTP,
    setupWebAuthn,
    disableWebAuthn,
    generateRecoveryCodes,
    downloadRecoveryCodes,
    copyRecoveryCodes,
    handleCopyRecoveryCodesStandalone,
    handleDownloadRecoveryCodesStandalone,
    confirmAndSaveRecoveryCodes,
    cancelRecoveryCodesModal,
  };
}
