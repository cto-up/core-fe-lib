"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useDictionary } from "@/components/dictionary-provider";
import { useDialog } from "./use-dialog";
import { MfaService } from "@/lib/openapi/core";
import { kratosService } from "../core/kratos-service";
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
    name: string,
): FlowNode | undefined {
    if (!nodes) return undefined;
    return nodes.find((node) => node.attributes?.name === name);
}

function findNodesByGroup(
    nodes: FlowNode[] | undefined,
    group: string,
): FlowNode[] {
    if (!nodes) return [];
    return nodes.filter((node) => node.group === group);
}

function findNodeByGroupAndType(
    nodes: FlowNode[] | undefined,
    group: string,
    type: string,
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
    const dict = useDictionary();
    const dialog = useDialog();

    const t = useCallback(
        (key: string): string => {
            const keys = key.split(".");
            let value: unknown = dict;
            for (const k of keys) {
                value = (value as Record<string, unknown>)?.[k];
            }
            return typeof value === "string" ? value : key;
        },
        [dict],
    );

    const [loading, setLoading] = useState(true);

    const [mfaStatus, setMfaStatus] = useState({
        totp_enabled: false,
        webauthn_enabled: false,
        recovery_codes_set: false,
        available_methods: [] as string[],
        aal: "aal1",
    });

    const [showTOTPSetup, setShowTOTPSetup] = useState(false);
    const [totpSetupStep, setTotpSetupStep] = useState<
        "qr" | "verify" | "recovery"
    >("qr");
    const [totpQRCode, setTotpQRCode] = useState("");
    const [totpSecretKey, setTotpSecretKey] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [totpError, setTotpError] = useState("");
    const [settingsFlowId, setSettingsFlowId] = useState<string | undefined>();
    const [csrfToken, setCsrfToken] = useState<string>("");

    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [recoveryCodesInteracted, setRecoveryCodesInteracted] =
        useState(false);

    useEffect(() => {
        const initialize = async () => {
            const urlParams = new URLSearchParams(globalThis.location.search);
            const needsRefresh = urlParams.get("refresh");

            if (needsRefresh === "true") {
                globalThis.history.replaceState(
                    {},
                    "",
                    globalThis.location.pathname,
                );
            }

            await loadMFAStatus();

            // Replay pending action that was interrupted by WebAuthn AAL2 redirect
            await replayPendingMfaAction();
        };

        initialize();
    }, []);

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
    const replayPendingMfaAction = useCallback(async () => {
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
            toast.error(t("mfa.notifications.loadError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.loadError"),
            });
        }
    }, [t]);

    const loadMFAStatus = useCallback(async () => {
        try {
            setLoading(true);
            const status = await MfaService.getMfaStatus();
            setMfaStatus(status);

            console.log("📊 MFA Status loaded:", {
                totp_enabled: status.totp_enabled,
                webauthn_enabled: status.webauthn_enabled,
                recovery_codes_set: status.recovery_codes_set,
                aal: status.aal,
            });
        } catch (error) {
            console.error("Failed to load MFA status:", error);
            toast.error(t("mfa.notifications.loadError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.loadError"),
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    const setupTOTP = useCallback(async () => {
        try {
            const flow = await MfaService.initializeSettingsFlow();

            if (!flow.id) {
                throw new Error("Invalid flow: missing flow ID");
            }

            setSettingsFlowId(flow.id);
            const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

            console.log("🔍 Settings flow initialized:", {
                flowId: flow.id,
                nodes: flowNodes.map((n: FlowNode) => ({
                    type: n.type,
                    group: n.group,
                    name: n.attributes?.name,
                    nodeType: (n.attributes as Record<string, unknown>)
                        ?.node_type,
                })),
            });

            const totpUnlinkNode = findNodeByName(flowNodes, "totp_unlink");
            if (totpUnlinkNode) {
                toast.error(t("mfa.notifications.totpAlreadyEnabled"), {
                    description: t("mfa.notifications.totpAlreadyEnabledDesc"),
                });
                await loadMFAStatus();
                return;
            }

            const csrfNode = findNodeByName(flowNodes, "csrf_token");
            if (csrfNode?.attributes?.value) {
                setCsrfToken(csrfNode.attributes.value as string);
            }

            const totpNode = findNodeByGroupAndType(flowNodes, "totp", "img");
            if (totpNode?.attributes?.src) {
                setTotpQRCode(
                    `<img src="${totpNode.attributes.src}" alt="QR Code" class="mx-auto" />`,
                );
                const secret = await getSecretFromFlow(
                    flow as unknown as Record<string, unknown>,
                );
                setTotpSecretKey(
                    secret || "Scan QR code with your authenticator app",
                );
            } else {
                console.error("❌ No TOTP QR code found in flow");
                toast.error(t("mfa.notifications.totpSetupError"), {
                    description:
                        "No QR code available. Please try again or contact support.",
                });
                return;
            }

            setShowTOTPSetup(true);
            setTotpSetupStep("qr");
        } catch (error: unknown) {
            console.error("❌ Failed to setup TOTP:", error);
            toast.error(t("mfa.notifications.totpSetupError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.totpSetupError"),
            });
        }
    }, [t, loadMFAStatus]);

    const validateTOTPInput = useCallback(() => {
        setTotpCode((prev) => {
            const cleaned = prev.replace(/\D/g, "").slice(0, 6);
            return cleaned;
        });
        setTotpError("");
    }, []);

    const setTotpCodeValue = useCallback((value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 6);
        setTotpCode(cleaned);
        setTotpError("");
    }, []);

    const nextTotpStep = useCallback(() => {
        if (totpSetupStep === "qr") {
            setTotpSetupStep("verify");
        }
    }, [totpSetupStep]);

    const verifyTOTP = useCallback(async () => {
        try {
            if (!settingsFlowId) return;

            console.log("🔐 Verifying TOTP:", {
                flowId: settingsFlowId,
                totpCode,
                csrfToken: csrfToken ? "present" : "missing",
            });

            await kratosService.submitSettingsMethod(settingsFlowId, "totp", {
                totp_code: totpCode,
                csrf_token: csrfToken,
            });

            console.log("✅ TOTP verified, generating recovery codes...");
            await generateRecoveryCodesForSetup();
            setTotpSetupStep("recovery");
            setTotpCode("");
            setTotpError("");
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
                        msg.text?.includes(
                            'additionalProperties "roles" not allowed',
                        ),
                    ),
                );

                if (hasRolesError) {
                    toast.error("Configuration Error", {
                        description:
                            "Your identity schema includes 'roles' in traits. Please contact support to fix your Kratos identity schema.",
                    });
                    return;
                }

                setSettingsFlowId(newFlow.id);
                const newCsrfNode = findNodeByName(newFlowNodes, "csrf_token");
                if (newCsrfNode?.attributes?.value) {
                    setCsrfToken(newCsrfNode.attributes.value as string);
                    console.log("🔄 Updated CSRF token from error response");
                }
            }

            if (error) {
                toast.error("Re-authentication Required", {
                    description: getUserFriendlyMessage(error) ?? String(error),
                });
                return;
            }

            setTotpError(t("mfa.setup.totp.invalidCode"));
            console.error("TOTP verification failed:", error);
        }
    }, [settingsFlowId, totpCode, csrfToken, t]);

    const cancelTOTPSetup = useCallback(() => {
        setShowTOTPSetup(false);
        setTotpCode("");
        setTotpError("");
        setTotpSetupStep("qr");
        setRecoveryCodesInteracted(false);
        setRecoveryCodes([]);
    }, []);

    const generateRecoveryCodesForSetup = useCallback(async () => {
        try {
            const flow = await MfaService.initializeSettingsFlow();
            const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

            const csrfNode = findNodeByName(flowNodes, "csrf_token");
            const csrf = (csrfNode?.attributes?.value as string) || "";

            console.log("🔑 Generating recovery codes with flow:", flow.id);

            const response = await kratosService.submitSettingsMethod(
                flow.id || "",
                "lookup_secret",
                { lookup_secret_regenerate: true, csrf_token: csrf },
            );

            console.log("✅ Recovery codes generated:", response);
            const codes = extractRecoveryCodes(
                response as Record<string, unknown>,
            );
            setRecoveryCodes(codes);

            if (codes.length === 0) {
                throw new Error("No recovery codes returned from Kratos");
            }

            const responseData = response as Record<string, unknown>;
            if (typeof responseData.id === "string") {
                setSettingsFlowId(responseData.id);
            }

            const responseUINodes = (
                responseData.ui && typeof responseData.ui === "object"
                    ? (responseData.ui as Record<string, unknown>).nodes
                    : undefined
            ) as FlowNode[] | undefined;

            const newCsrfNode = findNodeByName(responseUINodes, "csrf_token");
            if (newCsrfNode?.attributes?.value) {
                setCsrfToken(newCsrfNode.attributes.value as string);
            }
        } catch (error: unknown) {
            console.error("❌ Failed to generate recovery codes:", error);
            toast.error(t("mfa.notifications.recoveryError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.recoveryError"),
            });
            setShowTOTPSetup(false);
        }
    }, [t]);

    const confirmRecoveryCodesAndFinish = useCallback(async () => {
        try {
            if (!settingsFlowId) {
                throw new Error("No settings flow ID available");
            }

            console.log(
                "✅ Confirming recovery codes with flow:",
                settingsFlowId,
            );

            await kratosService.submitSettingsMethod(
                settingsFlowId,
                "lookup_secret",
                { lookup_secret_confirm: true, csrf_token: csrfToken },
            );

            console.log("🎉 Recovery codes confirmed, TOTP setup complete!");

            setShowTOTPSetup(false);
            setTotpSetupStep("qr");
            setRecoveryCodesInteracted(false);
            setRecoveryCodes([]);

            await loadMFAStatus();

            toast.success(t("mfa.notifications.totpEnabled"), {
                description: t("mfa.notifications.setupComplete"),
            });
        } catch (error) {
            console.error("❌ Failed to confirm recovery codes:", error);
            toast.error(t("mfa.notifications.recoveryError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.setupError"),
            });
        }
    }, [settingsFlowId, csrfToken, loadMFAStatus, t]);

    const handleCopyRecoveryCodes = useCallback(() => {
        copyRecoveryCodes();
        setRecoveryCodesInteracted(true);
    }, []);

    const handleDownloadRecoveryCodes = useCallback(() => {
        downloadRecoveryCodes();
        setRecoveryCodesInteracted(true);
    }, []);

    /**
     * Execute the actual TOTP disable (no confirmation dialog).
     * Used both directly and as a replay after WebAuthn AAL2 redirect.
     */
    const executeDisableTotp = useCallback(async () => {
        const flow = await MfaService.initializeSettingsFlow();
        const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

        const csrfNode = findNodeByName(flowNodes, "csrf_token");
        const csrf = (csrfNode?.attributes?.value as string) || "";

        await kratosService.submitSettingsMethod(flow.id || "", "totp", {
            totp_unlink: true,
            csrf_token: csrf,
        });

        await loadMFAStatus();
        toast.success(t("mfa.notifications.totpDisabled"), {
            description: t("mfa.notifications.totpDisabled"),
        });
    }, [loadMFAStatus, t]);

    const disableTOTP = useCallback(async () => {
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
            toast.error(t("mfa.notifications.totpDisableError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.totpDisableError"),
            });
        }
    }, [dialog, t, executeDisableTotp]);

    const setupWebAuthn = useCallback(() => {
        const registerUrl = buildWebAuthnRegisterUrl();

        console.log(
            "🔐 Navigating to auth subdomain for WebAuthn registration:",
            {
                currentUrl: globalThis.location.href,
                registerUrl,
            },
        );

        globalThis.location.href = registerUrl;
    }, []);

    const performWebAuthnRegistration = useCallback(async (): Promise<void> => {
        const session = await kratosService.getSession();
        if (!session?.identity?.traits?.email) {
            toast.error(t("mfa.notifications.notAuthenticated"), {
                description: "Please log in to set up WebAuthn",
            });
            throw new Error("No active session found");
        }

        const flow = await MfaService.initializeSettingsFlow();
        const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

        const webauthnNodes = findNodesByGroup(flowNodes, "webauthn");
        if (!webauthnNodes || webauthnNodes.length === 0) {
            toast.error(t("mfa.notifications.webauthnError"), {
                description:
                    "WebAuthn is not available in this settings flow. Please refresh and try again.",
            });
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

        const triggerNode = findNodeByName(
            flowNodes,
            "webauthn_register_trigger",
        );
        if (!triggerNode?.attributes?.value) {
            toast.error(t("mfa.notifications.webauthnError"), {
                description:
                    "WebAuthn challenge not found. Please refresh and try again.",
            });
            throw new Error("WebAuthn challenge not found");
        }

        const publicKeyOptions = JSON.parse(
            String(triggerNode.attributes.value),
        );

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
                    publicKeyOptions.publicKey.challenge,
                ),
                user: {
                    ...publicKeyOptions.publicKey.user,
                    id: base64urlToArrayBuffer(
                        publicKeyOptions.publicKey.user.id,
                    ),
                },
                excludeCredentials:
                    publicKeyOptions.publicKey.excludeCredentials?.map(
                        (cred: Record<string, unknown>) => ({
                            ...cred,
                            id: base64urlToArrayBuffer(cred.id as string),
                        }),
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
                attestationObject: arrayBufferToBase64url(
                    response.attestationObject,
                ),
                clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
            },
        };

        await kratosService.submitSettingsMethod(flow.id || "", "webauthn", {
            webauthn_register: JSON.stringify(credentialData),
            webauthn_register_displayname: displayName,
            csrf_token: csrf,
        });
    }, [t]);

    /**
     * Execute the actual WebAuthn disable (no confirmation dialog).
     */
    const executeDisableWebAuthn = useCallback(async () => {
        await MfaService.disableWebAuthn();
        console.log("✅ WebAuthn disabled successfully via Admin API");
        await loadMFAStatus();
        toast.success(t("mfa.notifications.webauthnDisabled"), {
            description: t("mfa.notifications.webauthnDisabled"),
        });
    }, [loadMFAStatus, t]);

    const disableWebAuthn = useCallback(async () => {
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
            toast.error(t("mfa.notifications.webauthnDisableError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.webauthnDisableError"),
            });
        }
    }, [dialog, t, executeDisableWebAuthn]);

    /**
     * Execute the actual recovery codes generation (no confirmation dialog).
     * Used both directly and as a replay after WebAuthn AAL2 redirect.
     */
    const executeGenerateRecoveryCodes = useCallback(async () => {
        const flow = await MfaService.initializeSettingsFlow();
        const flowNodes = (flow.ui?.nodes as FlowNode[] | undefined) || [];

        const csrfNode = findNodeByName(flowNodes, "csrf_token");
        const csrf = (csrfNode?.attributes?.value as string) || "";

        const regenerateResponse = await kratosService.submitSettingsMethod(
            flow.id || "",
            "lookup_secret",
            { lookup_secret_regenerate: true, csrf_token: csrf },
        );

        console.log("✅ Recovery codes regenerated:", regenerateResponse);
        const codes = extractRecoveryCodes(
            regenerateResponse as Record<string, unknown>,
        );
        setRecoveryCodes(codes);

        if (codes.length === 0) {
            throw new Error("No recovery codes returned from Kratos");
        }

        const regenerateData = regenerateResponse as Record<string, unknown>;
        if (typeof regenerateData.id === "string") {
            setSettingsFlowId(regenerateData.id);
        }

        const regenerateUINodes = (
            regenerateData.ui && typeof regenerateData.ui === "object"
                ? (regenerateData.ui as Record<string, unknown>).nodes
                : undefined
        ) as FlowNode[] | undefined;

        const newCsrfNode = findNodeByName(regenerateUINodes, "csrf_token");
        if (newCsrfNode?.attributes?.value) {
            setCsrfToken(newCsrfNode.attributes.value as string);
        }

        setRecoveryCodesInteracted(false);
        setShowRecoveryCodes(true);
    }, []);

    const generateRecoveryCodes = useCallback(async () => {
        setPendingMfaAction("generate_recovery_codes");

        try {
            await executeGenerateRecoveryCodes();
            consumePendingMfaAction();
        } catch (error: unknown) {
            consumePendingMfaAction();
            console.error("Failed to generate recovery codes:", error);
            toast.error(t("mfa.notifications.recoveryError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.recoveryError"),
            });
        }
    }, [t, executeGenerateRecoveryCodes]);

    const downloadRecoveryCodes = useCallback(() => {
        const content = recoveryCodes.join("\n");
        const blob = new Blob([content], { type: "text/plain" });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "recovery-codes.txt";
        a.click();
        globalThis.URL.revokeObjectURL(url);
    }, [recoveryCodes]);

    const copyRecoveryCodes = useCallback(async () => {
        const content = recoveryCodes.join("\n");
        await navigator.clipboard.writeText(content);
        toast.success(t("mfa.notifications.recoveryCopied"), {
            description: t("mfa.notifications.recoveryCopied"),
        });
    }, [recoveryCodes, t]);

    const handleCopyRecoveryCodesStandalone = useCallback(() => {
        copyRecoveryCodes();
        setRecoveryCodesInteracted(true);
    }, [copyRecoveryCodes]);

    const handleDownloadRecoveryCodesStandalone = useCallback(() => {
        downloadRecoveryCodes();
        setRecoveryCodesInteracted(true);
    }, [downloadRecoveryCodes]);

    const confirmAndSaveRecoveryCodes = useCallback(async () => {
        try {
            if (!settingsFlowId) {
                throw new Error("No settings flow ID available");
            }

            console.log(
                "✅ Confirming and saving recovery codes with flow:",
                settingsFlowId,
            );

            await kratosService.submitSettingsMethod(
                settingsFlowId,
                "lookup_secret",
                { lookup_secret_confirm: true, csrf_token: csrfToken },
            );

            console.log("🎉 Recovery codes confirmed and saved!");

            setShowRecoveryCodes(false);
            setRecoveryCodesInteracted(false);
            setRecoveryCodes([]);

            await loadMFAStatus();

            toast.success(t("mfa.notifications.recoveryGenerated"), {
                description: t("mfa.notifications.setupComplete"),
            });
        } catch (error) {
            console.error("❌ Failed to confirm recovery codes:", error);
            toast.error(t("mfa.notifications.recoveryError"), {
                description:
                    getUserFriendlyMessage(error) ??
                    t("mfa.notifications.setupError"),
            });
        }
    }, [settingsFlowId, csrfToken, loadMFAStatus, t]);

    const cancelRecoveryCodesModal = useCallback(async () => {
        if (!recoveryCodesInteracted) {
            const confirmed = await dialog.confirm({
                title: t("mfa.confirmations.cancelRecoveryCodes"),
                message: t("mfa.confirmations.cancelRecoveryCodesDescription"),
                ok: t("actions.confirm"),
                cancel: t("actions.cancel"),
            });

            if (!confirmed) return;
        }
        closeRecoveryCodesModal();
    }, [recoveryCodesInteracted, dialog, t]);

    const closeRecoveryCodesModal = useCallback(() => {
        setShowRecoveryCodes(false);
        setRecoveryCodesInteracted(false);
        setRecoveryCodes([]);
    }, []);

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
        setTotpCodeValue,
        nextTotpStep,
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
