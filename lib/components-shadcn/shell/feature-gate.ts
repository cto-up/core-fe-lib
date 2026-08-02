import { Role } from "../../openapi/core/models/Role";
import type { HubModule, AppContext } from "./types";

/**
 * The privilege a module demands. `superAdminOnly` / `adminOnly` are shorthand
 * for the equivalent `requiredPrivilege`, so there is a single evaluation path.
 */
function modulePrivilege(module: HubModule): Role | undefined {
  if (module.superAdminOnly) return Role.SUPER_ADMIN;
  if (module.adminOnly) return Role.ADMIN;
  return module.requiredPrivilege;
}

/**
 * Checks whether a module should be enabled given raw store values.
 * Safe to call outside Vue setup context (e.g., in router guards).
 */
export function isModuleEnabledForUser(
  module: HubModule,
  features: Record<string, boolean> | undefined,
  hasPrivilege: (role: Role) => boolean
): boolean {
  if (module.requiredFeature && !features?.[module.requiredFeature]) {
    return false;
  }
  const required = modulePrivilege(module);
  return !required || hasPrivilege(required);
}

/**
 * Checks whether a module should be enabled given a full AppContext.
 * For use inside Vue composables / setup context.
 */
export function isModuleEnabled(module: HubModule, ctx: AppContext): boolean {
  return isModuleEnabledForUser(
    module,
    ctx.tenantStore.tenant?.features,
    (role) => ctx.userStore.hasPrivilege(role)
  );
}
