"use client";

import { useMemo } from "react";
import { useTenantStore } from "./tenant-context";
import { useKratosAuth } from "./use-kratos-auth";

export function useTenant() {
    const tenantStore = useTenantStore();
    const { session } = useKratosAuth();

    const canSignUp = useMemo(() => {
        return tenantStore.tenant?.allow_sign_up ?? false;
    }, [tenantStore.tenant?.allow_sign_up]);

    const tenantID = useMemo(() => {
        const metadataPublic = session?.identity.metadata_public;
        return metadataPublic?.tenant_id
            || metadataPublic?.tenant_memberships?.[0]?.tenant_id
            || null;
    }, [session?.identity.metadata_public]);

    const subdomain = useMemo(() => {
        return session?.identity.metadata_public?.subdomain || null;
    }, [session?.identity.metadata_public?.subdomain]);

    const tenantName = useMemo(() => {
        return session?.identity.metadata_public?.tenant_name || null;
    }, [session?.identity.metadata_public?.tenant_name]);

    const hasTenant = useMemo(() => {
        return !!tenantID;
    }, [tenantID]);

    const currentSubdomain = useMemo(() => {
        const hostname = globalThis.location.hostname;
        const parts = hostname.split(".");

        if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            return null;
        }

        if (parts.length > 2) {
            return parts[0];
        }

        return null;
    }, []);

    return {
        canSignUp,
        tenantID,
        subdomain,
        tenantName,
        hasTenant,
        currentSubdomain,
    };
}
