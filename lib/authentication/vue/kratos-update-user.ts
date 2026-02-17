/**
 * Update user store from Kratos session (Vue/Pinia specific)
 */

import { type KratosSession } from "../core/kratos-service";
import { useUserStore } from "core-fe-lib/stores/user-store";
import type { LoggedUser } from "core-fe-lib/models/logged-user";

export async function updateUserFromSession(
  kratosSession: KratosSession | null
) {
  const userStore = useUserStore();

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

  const { useTenantStore } = await import("core-fe-lib/stores/tenant-store");
  const tenantStore = useTenantStore();
  const currentTenantId = tenantStore.tenant?.tenant_id;

  let tenantRoles: string[] = [];
  if (currentTenantId && tenantMemberships.length > 0) {
    const currentTenantMembership = tenantMemberships.find(
      (membership: { tenant_id: string; roles: string[] }) =>
        membership.tenant_id === currentTenantId
    );
    tenantRoles = currentTenantMembership?.roles || [];
  } else if (!currentTenantId && tenantMemberships.length > 0) {
    console.log("ℹ️  Tenant not loaded yet, using global roles only");
  }

  const roles = [...new Set([...globalRoles, ...tenantRoles])];

  const user: LoggedUser = {
    id: kratosSession.identity.id,
    uid: kratosSession.identity.id,
    email: kratosSession.identity.traits.email,
    name: kratosSession.identity.traits.name || "",
    roles: roles,
  } as LoggedUser;

  if (globalRoles.length === 0 && tenantRoles.length === 0) {
    console.warn("⚠️  No roles found. User may not have proper permissions.");
  }

  userStore.setUser(user);
}
