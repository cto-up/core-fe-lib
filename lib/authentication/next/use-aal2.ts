"use client";

/**
 * React hook for AAL2 verification UI interactions
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useDictionary } from "@/components/dictionary-provider";
import { useAal2Store } from "./aal2-store";
import { buildWebAuthnVerifyUrl } from "../core/auth-domain";

/**
 * Submit WebAuthn for AAL2 verification
 * Navigates to auth subdomain for same-origin requirement
 */
export function submitWebAuthnVerification() {
    const verifyUrl = buildWebAuthnVerifyUrl();

    console.log("🔐 Navigating to auth subdomain for WebAuthn verification:", {
        currentUrl: globalThis.location.href,
        verifyUrl,
    });

    globalThis.location.href = verifyUrl;
}

export function useAal2() {
    const dict = useDictionary();
    const aal2Store = useAal2Store();

    const t = useCallback(
        (key: string): string => {
            // Simple translation function - adjust based on your dictionary structure
            const keys = key.split(".");
            let value: unknown = dict;
            for (const k of keys) {
                value = (value as Record<string, unknown>)?.[k];
            }
            return typeof value === "string" ? value : key;
        },
        [dict],
    );

    async function submitTotpVerification() {
        if (!aal2Store.state.flowId || !aal2Store.state.totpCode) {
            aal2Store.updateState({ error: t("mfa.setup.totp.enterCode") });
            return;
        }

        try {
            await aal2Store.manager.submitTotp();
            toast.success(t("mfa.notifications.verificationSuccess"), {
                description: t("mfa.notifications.verificationSuccessDesc"),
            });
        } catch (error: unknown) {
            console.error("TOTP verification failed:", error);
            aal2Store.updateState({
                error:
                    t("mfa.setup.totp.invalidCode") ||
                    "Invalid code. Please try again.",
            });
        }
    }

    async function submitLookupVerification() {
        if (!aal2Store.state.flowId || !aal2Store.state.lookupCode) {
            aal2Store.updateState({ error: t("mfa.recovery.enterCode") });
            return;
        }

        try {
            await aal2Store.manager.submitLookup();
            toast.success(t("mfa.notifications.verificationSuccess"), {
                description: t("mfa.notifications.verificationSuccessDesc"),
            });
        } catch (error: unknown) {
            console.error("Lookup verification failed:", error);
            aal2Store.updateState({
                error:
                    t("mfa.recovery.invalidCode") ||
                    "Invalid code. Please try again.",
            });
        }
    }

    function validateTotpInput(value?: string) {
        const inputValue = value ?? aal2Store.state.totpCode;
        const cleaned = aal2Store.manager.validateTotpInput(inputValue);
        aal2Store.updateState({ totpCode: cleaned, error: "" });
    }

    function validateLookupInput(value?: string) {
        const inputValue = value ?? aal2Store.state.lookupCode;
        const cleaned = aal2Store.manager.validateLookupInput(inputValue);
        aal2Store.updateState({ lookupCode: cleaned, error: "" });
    }

    function cancelAal2Verification() {
        aal2Store.resolveVerification(false);
    }

    function switchToMethod(method: "totp" | "webauthn" | "lookup_secret") {
        aal2Store.manager.switchMethod(method);
    }

    return {
        aal2State: aal2Store.state,
        submitTotpVerification,
        submitWebAuthnVerification,
        submitLookupVerification,
        validateTotpInput,
        validateLookupInput,
        cancelAal2Verification,
        switchToMethod,
    };
}
