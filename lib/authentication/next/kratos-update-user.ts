/**
 * Update user store from Kratos session (React Context specific)
 */

import { type KratosSession } from "../core/kratos-service";
import type { LoggedUser } from "@/lib/models/logged-user";
import { useKratosUserStore } from "./user-context";
import { useTenantStore } from "./tenant-context";

/**
 * Update user context from Kratos session
 * This function should be called from within a React component or hook
 * that has access to the context providers.
 */
export async function updateUserFromSession(
    kratosSession: KratosSession | null,
) {
    // Note: This function needs to be called from within a component/hook
    // that has access to the context. We'll export a hook version instead.
    throw new Error(
        "updateUserFromSession must be called via useUpdateUserFromSession hook",
    );
}

/**
 * Hook to update user from Kratos session
 */
export function useUpdateUserFromSession() {
    const userStore = useKratosUserStore();
    const tenantStore = useTenantStore();

    return async (
        kratosSession: KratosSession | null,
        overrideTenantId?: string,
    ) => {
        if (!kratosSession) {
            userStore.setUser(null);
            userStore.setSession(null);
            return;
        }

        userStore.setSession(kratosSession);

        const globalRoles =
            kratosSession.identity.metadata_public?.global_roles || [];

        const tenantMemberships =
            kratosSession.identity.metadata_public?.tenant_memberships || [];

        // Use overrideTenantId (passed directly) to avoid React state timing issues
        const currentTenantId =
            overrideTenantId || tenantStore.tenant?.tenant_id;

        let tenantRoles: string[] = [];
        if (currentTenantId && tenantMemberships.length > 0) {
            const currentTenantMembership = tenantMemberships.find(
                (membership: { tenant_id: string; roles: string[] }) =>
                    membership.tenant_id === currentTenantId,
            );
            tenantRoles = currentTenantMembership?.roles || [];
        } else if (!currentTenantId && tenantMemberships.length > 0) {
            console.log("ℹ️  Tenant not loaded yet, using global roles only");
        }

        const roles = [...new Set([...globalRoles, ...tenantRoles])];

        const user: LoggedUser = {
            id: kratosSession.identity.id,
            email: kratosSession.identity.traits.email,
            name: kratosSession.identity.traits.name || "",
            roles: roles,
        } as LoggedUser;

        if (globalRoles.length === 0 && tenantRoles.length === 0) {
            console.warn(
                "⚠️  No roles found. User may not have proper permissions.",
            );
        }

        userStore.setUser(user);
    };
}
