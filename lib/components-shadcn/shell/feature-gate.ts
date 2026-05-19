import type { HubModule, AppContext } from "./types";

/**
 * Checks whether a module should be enabled given raw store values.
 * Safe to call outside Vue setup context (e.g., in router guards).
 */
export function isModuleEnabledForUser(
  module: HubModule,
  features: Record<string, boolean> | undefined,
  isAdmin: boolean,
  isSuperAdmin: boolean
): boolean {
  if (module.requiredFeature && !features?.[module.requiredFeature]) {
    return false;
  }
  if (module.superAdminOnly && !isSuperAdmin) {
    return false;
  }
  if (module.adminOnly && !isAdmin && !isSuperAdmin) {
    return false;
  }
  return true;
}

/**
 * Checks whether a module should be enabled given a full AppContext.
 * For use inside Vue composables / setup context.
 */
export function isModuleEnabled(module: HubModule, ctx: AppContext): boolean {
  return isModuleEnabledForUser(
    module,
    ctx.tenantStore.tenant?.features,
    ctx.userStore.isAdmin,
    ctx.userStore.isSuperAdmin
  );
}
