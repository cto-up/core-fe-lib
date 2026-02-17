import { ref, onMounted, inject } from "vue";
import { useI18n } from "vue-i18n";
import { MfaService } from "core-fe-lib/openapi/core";
import { kratosService } from "../core/kratos-service";
import {
  notificationServiceKey,
  dialogServiceKey,
} from "../../plugins/injection-keys";
import { getUserFriendlyMessage } from "../core/kratos-error-processor";
import type { SettingsFlowNode } from "../core/types/kratos-errors";
import {
  extractRecoveryCodes,
  getSecretFromFlow,
} from "../core/kratos-flow-helpers";
import { buildWebAuthnRegisterUrl } from "../core/auth-domain";

interface FlowNode extends SettingsFlowNode {
  attributes: {
    name?: string;
    value?: unknown;
    [key: string]: unknown;
  };
}

function findNodeByName(
  nodes: FlowNode[] | undefined,
  name: string
): FlowNode | undefined {
  if (!nodes) return undefined;
  return nodes.find((node) => node.attributes?.name === name);
}

function findNodesByGroup(
  nodes: FlowNode[] | undefined,
  group: string
): FlowNode[] {
  if (!nodes) return [];
  return nodes.filter((node) => node.group === group);
}

function findNodeByGroupAndType(
  nodes: FlowNode[] | undefined,
  group: string,
  type: string
): FlowNode | undefined {
  if (!nodes) return undefined;
  return nodes.find((node) => node.group === group && node.type === type);
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = base64 + padding;
  const binaryString = window.atob(base64Padded);
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
    const urlParams = new URLSearchParams(globalThis.location.search);
    const needsRefresh = urlParams.get("refresh");

    if (needsRefresh === "true") {
      globalThis.history.replaceState({}, "", globalThis.location.pathname);
    }

    await loadMFAStatus();

    // Replay pending action that was interrupted by WebAuthn AAL2 redirect
    await replayPendingMfaAction();
  });

  const PENDING_MFA_ACTION_KEY = "pending_mfa_action";

  function setPendingMfaAction(action: string) {
    sessionStorage.setItem(PENDING_MFA_ACTION_KEY, action);
  }

  function consumePendingMfaAction(): string | null {
    const action = sessionStorage.getItem(PENDING_MFA_ACTION_KEY);
    sessionStorage.removeItem(PENDING_MFA_ACTION_KEY);
    return action;
  }

  /**
   * Replay a pending MFA action that was interrupted by a WebAuthn AAL2 redirect.
   * After WebAuthn completes on the auth subdomain, the browser navigates back
   * and the session is now at AAL2 — so the action can succeed.
   */
  async function replayPendingMfaAction() {
    const action = consumePendingMfaAction();
    if (!action) return;

    console.log("🔄 Replaying pending MFA action:", action);

    try {
      if (action === "disable_totp") {
        await executeDisableTotp();
      } else if (action === "disable_webauthn") {
        await executeDisableWebAuthn();
      } else if (action === "generate_recovery_codes") {
        await executeGenerateRecoveryCodes();
      }
    } catch (error) {
      console.error("❌ Failed to replay pending MFA action:", error);
      notifications.error(
        t("mfa.notifications.loadError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.loadError")
      );
    }
  }

  async function loadMFAStatus() {
    try {
      loading.value = true;
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
        t("mfa.notifications.loadError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.loadError")
      );
    } finally {
      loading.value = false;
    }
  }

  async function setupTOTP() {
    try {
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

      const totpUnlinkNode = findNodeByName(flowNodes, "totp_unlink");
      if (totpUnlinkNode) {
        notifications.error(
          t("mfa.notifications.totpAlreadyEnabled"),
          t("mfa.notifications.totpAlreadyEnabledDesc")
        );
        await loadMFAStatus();
        return;
      }

      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      if (csrfNode?.attributes?.value) {
        csrfToken.value = csrfNode.attributes.value as string;
      }

      const totpNode = findNodeByGroupAndType(flowNodes, "totp", "img");
      if (totpNode?.attributes?.src) {
        totpQRCode.value = `<img src="${totpNode.attributes.src}" alt="QR Code" class="mx-auto" />`;
        const secret = await getSecretFromFlow(
          flow as unknown as Record<string, unknown>
        );
        totpSecretKey.value =
          secret || "Scan QR code with your authenticator app";
      } else {
        console.error("❌ No TOTP QR code found in flow");
        notifications.error(
          t("mfa.notifications.totpSetupError"),
          "No QR code available. Please try again or contact support."
        );
        return;
      }

      showTOTPSetup.value = true;
      totpSetupStep.value = "qr";
    } catch (error: unknown) {
      console.error("❌ Failed to setup TOTP:", error);
      notifications.error(
        t("mfa.notifications.totpSetupError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.totpSetupError")
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

      console.log("✅ TOTP verified, generating recovery codes...");
      await generateRecoveryCodesForSetup();
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
            ui?: { nodes?: FlowNode[] };
          };
        };
      } | null;

      console.error("❌ TOTP verification failed:", {
        status: axiosError?.response?.status,
        statusText: axiosError?.response?.statusText,
        data: axiosError?.response?.data,
        error,
      });

      if (
        axiosError?.response?.status === 400 &&
        axiosError.response?.data?.id
      ) {
        const newFlow = axiosError.response.data;
        const newFlowNodes =
          (newFlow.ui?.nodes as FlowNode[] | undefined) || [];

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

      totpError.value = t("mfa.setup.totp.invalidCode");
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
      const flow = await MfaService.initializeSettingsFlow();
      const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

      const csrfNode = findNodeByName(flowNodes, "csrf_token");
      const csrf = (csrfNode?.attributes?.value as string) || "";

      console.log("🔑 Generating recovery codes with flow:", flow.id);

      const response = await kratosService.submitSettingsMethod(
        flow.id || "",
        "lookup_secret",
        { lookup_secret_regenerate: true, csrf_token: csrf }
      );

      console.log("✅ Recovery codes generated:", response);
      recoveryCodes.value = extractRecoveryCodes(
        response as Record<string, unknown>
      );

      if (recoveryCodes.value.length === 0) {
        throw new Error("No recovery codes returned from Kratos");
      }

      const responseData = response as Record<string, unknown>;
      if (typeof responseData.id === "string") {
        settingsFlowId.value = responseData.id;
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
        t("mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.recoveryError")
      );
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

      await kratosService.submitSettingsMethod(
        settingsFlowId.value,
        "lookup_secret",
        { lookup_secret_confirm: true, csrf_token: csrfToken.value }
      );

      console.log("🎉 Recovery codes confirmed, TOTP setup complete!");

      showTOTPSetup.value = false;
      totpSetupStep.value = "qr";
      recoveryCodesInteracted.value = false;
      recoveryCodes.value = [];

      await loadMFAStatus();

      notifications.success(
        t("mfa.notifications.totpEnabled"),
        t("mfa.notifications.setupComplete")
      );
    } catch (error) {
      console.error("❌ Failed to confirm recovery codes:", error);
      notifications.error(
        t("mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.setupError")
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

  /**
   * Execute the actual TOTP disable (no confirmation dialog).
   * Used both directly and as a replay after WebAuthn AAL2 redirect.
   */
  async function executeDisableTotp() {
    const flow = await MfaService.initializeSettingsFlow();
    const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

    const csrfNode = findNodeByName(flowNodes, "csrf_token");
    const csrf = (csrfNode?.attributes?.value as string) || "";

    await kratosService.submitSettingsMethod(flow.id || "", "totp", {
      totp_unlink: true,
      csrf_token: csrf,
    });

    await loadMFAStatus();
    notifications.success(
      t("mfa.notifications.totpDisabled"),
      t("mfa.notifications.totpDisabled")
    );
  }

  async function disableTOTP() {
    const confirmed = await dialog.confirm({
      title: t("mfa.confirmations.disableTotp"),
      message: t("mfa.confirmations.disableTotpDescription"),
      ok: t("actions.confirm"),
      cancel: t("actions.cancel"),
    });

    if (!confirmed) return;

    // Store pending action before attempting — if AAL2 WebAuthn triggers
    // a full page redirect, we can replay this on return.
    setPendingMfaAction("disable_totp");

    try {
      await executeDisableTotp();
      // Success — clear the pending action
      consumePendingMfaAction();
    } catch (error: unknown) {
      consumePendingMfaAction();
      console.error("❌ Failed to disable TOTP:", error);
      notifications.error(
        t("mfa.notifications.totpDisableError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.totpDisableError")
      );
    }
  }

  async function setupWebAuthn() {
    const registerUrl = buildWebAuthnRegisterUrl();

    console.log("🔐 Navigating to auth subdomain for WebAuthn registration:", {
      currentUrl: globalThis.location.href,
      registerUrl,
    });

    globalThis.location.href = registerUrl;
  }

  async function performWebAuthnRegistration(): Promise<void> {
    const session = await kratosService.getSession();
    if (!session?.identity?.traits?.email) {
      notifications.error(
        t("mfa.notifications.notAuthenticated"),
        "Please log in to set up WebAuthn"
      );
      throw new Error("No active session found");
    }

    const flow = await MfaService.initializeSettingsFlow();
    const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

    const webauthnNodes = findNodesByGroup(flowNodes, "webauthn");
    if (!webauthnNodes || webauthnNodes.length === 0) {
      notifications.error(
        t("mfa.notifications.webauthnError"),
        "WebAuthn is not available in this settings flow. Please refresh and try again."
      );
      throw new Error("WebAuthn is not available in this settings flow");
    }

    const csrfNode = findNodeByName(flowNodes, "csrf_token");
    const csrf = (csrfNode?.attributes?.value as string) || "";
    if (!csrf) {
      throw new Error("Missing CSRF token");
    }

    let displayName = "Security Key";
    const email = (
      session?.identity?.traits as Record<string, unknown> | undefined
    )?.email;
    if (email) {
      displayName = email as string;
    }

    const triggerNode = findNodeByName(flowNodes, "webauthn_register_trigger");
    if (!triggerNode?.attributes?.value) {
      notifications.error(
        t("mfa.notifications.webauthnError"),
        "WebAuthn challenge not found. Please refresh and try again."
      );
      throw new Error("WebAuthn challenge not found");
    }

    const publicKeyOptions = JSON.parse(String(triggerNode.attributes.value));

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
        challenge: base64urlToArrayBuffer(publicKeyOptions.publicKey.challenge),
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

    const credential = await navigator.credentials.create({
      publicKey:
        publicKeyCredentialCreationOptions as PublicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error("WebAuthn credential creation was cancelled");
    }

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

    await kratosService.submitSettingsMethod(flow.id || "", "webauthn", {
      webauthn_register: JSON.stringify(credentialData),
      webauthn_register_displayname: displayName,
      csrf_token: csrf,
    });
  }

  /**
   * Execute the actual WebAuthn disable (no confirmation dialog).
   */
  async function executeDisableWebAuthn() {
    await MfaService.disableWebAuthn();
    console.log("✅ WebAuthn disabled successfully via Admin API");
    await loadMFAStatus();
    notifications.success(
      t("mfa.notifications.webauthnDisabled"),
      t("mfa.notifications.webauthnDisabled")
    );
  }

  async function disableWebAuthn() {
    const confirmed = await dialog.confirm({
      title: t("mfa.confirmations.disableWebauthn"),
      message: t("mfa.confirmations.disableWebauthnDescription"),
      ok: t("actions.confirm"),
      cancel: t("actions.cancel"),
    });

    if (!confirmed) return;

    setPendingMfaAction("disable_webauthn");

    try {
      await executeDisableWebAuthn();
      consumePendingMfaAction();
    } catch (error: unknown) {
      consumePendingMfaAction();
      console.error("❌ Failed to disable WebAuthn:", error);
      notifications.error(
        t("mfa.notifications.webauthnDisableError"),
        getUserFriendlyMessage(error) ??
          t("mfa.notifications.webauthnDisableError")
      );
    }
  }

  /**
   * Execute the actual recovery codes generation (no confirmation dialog).
   * Used both directly and as a replay after WebAuthn AAL2 redirect.
   */
  async function executeGenerateRecoveryCodes() {
    const flow = await MfaService.initializeSettingsFlow();
    const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

    const csrfNode = findNodeByName(flowNodes, "csrf_token");
    const csrf = (csrfNode?.attributes?.value as string) || "";

    const regenerateResponse = await kratosService.submitSettingsMethod(
      flow.id || "",
      "lookup_secret",
      { lookup_secret_regenerate: true, csrf_token: csrf }
    );

    console.log("✅ Recovery codes regenerated:", regenerateResponse);
    recoveryCodes.value = extractRecoveryCodes(
      regenerateResponse as Record<string, unknown>
    );

    if (recoveryCodes.value.length === 0) {
      throw new Error("No recovery codes returned from Kratos");
    }

    const regenerateData = regenerateResponse as Record<string, unknown>;
    if (typeof regenerateData.id === "string") {
      settingsFlowId.value = regenerateData.id;
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

    recoveryCodesInteracted.value = false;
    showRecoveryCodes.value = true;
  }

  async function generateRecoveryCodes() {
    setPendingMfaAction("generate_recovery_codes");

    try {
      await executeGenerateRecoveryCodes();
      consumePendingMfaAction();
    } catch (error: unknown) {
      consumePendingMfaAction();
      console.error("Failed to generate recovery codes:", error);
      notifications.error(
        t("mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.recoveryError")
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
      t("mfa.notifications.recoveryCopied"),
      t("mfa.notifications.recoveryCopied")
    );
  }

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

      await kratosService.submitSettingsMethod(
        settingsFlowId.value,
        "lookup_secret",
        { lookup_secret_confirm: true, csrf_token: csrfToken.value }
      );

      console.log("🎉 Recovery codes confirmed and saved!");

      showRecoveryCodes.value = false;
      recoveryCodesInteracted.value = false;
      recoveryCodes.value = [];

      await loadMFAStatus();

      notifications.success(
        t("mfa.notifications.recoveryGenerated"),
        t("mfa.notifications.setupComplete")
      );
    } catch (error) {
      console.error("❌ Failed to confirm recovery codes:", error);
      notifications.error(
        t("mfa.notifications.recoveryError"),
        getUserFriendlyMessage(error) ?? t("mfa.notifications.setupError")
      );
    }
  }

  async function cancelRecoveryCodesModal() {
    if (!recoveryCodesInteracted.value) {
      const confirmed = await dialog.confirm({
        title: t("mfa.confirmations.cancelRecoveryCodes"),
        message: t("mfa.confirmations.cancelRecoveryCodesDescription"),
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
    performWebAuthnRegistration,
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
