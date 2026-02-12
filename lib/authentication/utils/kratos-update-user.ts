/**
 * Kratos Auth Composable
 *
 */

import { type KratosSession } from "../services/kratos.service";
import { useUserStore } from "core-fe-lib/stores/user-store";
import type { LoggedUser } from "core-fe-lib/models/logged-user";

/**
 * Shared function to update user store from Kratos session
 */
export async function updateUserFromSession(
  kratosSession: KratosSession | null
) {
  const userStore = useUserStore();

  if (!kratosSession) {
    userStore.setUser(null);
    return;
  }

  // Global roles are in metadata_public.global_roles (e.g., SUPER_ADMIN)
  const globalRoles =
    kratosSession.identity.metadata_public?.global_roles || [];

  // Tenant-specific roles (CUSTOMER_ADMIN, ADMIN, USER) are in tenant_memberships
  const tenantMemberships =
    kratosSession.identity.metadata_public?.tenant_memberships || [];

  // Get current tenant ID from tenant store
  const { useTenantStore } = await import("core-fe-lib/stores/tenant-store");
  const tenantStore = useTenantStore();
  const currentTenantId = tenantStore.tenant?.tenant_id;

  // Extract roles for current tenant
  let tenantRoles: string[] = [];
  if (currentTenantId && tenantMemberships.length > 0) {
    const currentTenantMembership = tenantMemberships.find(
      (membership: any) => membership.tenant_id === currentTenantId
    );
    tenantRoles = currentTenantMembership?.roles || [];
  } else if (!currentTenantId && tenantMemberships.length > 0) {
    // Tenant not loaded yet, but user has memberships
    // This can happen during initial load - just use global roles for now
    console.log("ℹ️  Tenant not loaded yet, using global roles only");
  }

  // Merge global roles and tenant roles
  const roles = [...new Set([...globalRoles, ...tenantRoles])];

  const user: LoggedUser = {
    id: kratosSession.identity.id,
    uid: kratosSession.identity.id,
    email: kratosSession.identity.traits.email,
    name: kratosSession.identity.traits.name || "",
    roles: roles, // Merged global and tenant roles
  } as LoggedUser;

  if (globalRoles.length === 0 && tenantRoles.length === 0) {
    console.warn("⚠️  No roles found. User may not have proper permissions.");
  }

  userStore.setUser(user);
}
