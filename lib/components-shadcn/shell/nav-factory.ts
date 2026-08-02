import { computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useTenantStore } from "../../stores/tenant-store";
import { useUserStore } from "../../stores/user-store";
import { useUrl } from "../../composables/useUrl";
import type { MenuItem, MenuLink } from "../types/menu-link";
import type { Role } from "../../openapi/core/models/Role";
import type { AppContext } from "./types";
import { isModuleEnabled } from "./feature-gate";
import { getModules } from "./registry";

/**
 * Drops items the user lacks the privilege for, recursively, then drops any
 * group left with no visible children. Without this the per-item
 * `requiredPrivilege` declared in every module's links.ts is inert and the
 * only real gate is the coarse module-level one.
 */
export function visibleItems(
  items: MenuItem[] | undefined,
  hasPrivilege: (role: Role) => boolean
): MenuItem[] | undefined {
  if (!items) return undefined;
  return items
    .filter((i) => !i.requiredPrivilege || hasPrivilege(i.requiredPrivilege))
    .map((i) =>
      i.items?.length ? { ...i, items: visibleItems(i.items, hasPrivilege) } : i
    )
    .filter((i) => i.link || i.items?.length);
}

/**
 * Reactive composable that aggregates nav links from all registered modules.
 * Replaces the old useMenuLinks() from @/router/links.
 */
export function useShellNav(): ComputedRef<MenuLink[]> {
  const tenantStore = useTenantStore();
  const userStore = useUserStore();
  const { isTenantSubdomain } = useUrl();
  const { t } = useI18n();

  return computed((): MenuLink[] => {
    const ctx: AppContext = {
      t,
      userStore,
      tenantStore,
      isTenantSubdomain,
    };

    const hasPrivilege = (role: Role) => userStore.hasPrivilege(role);

    return getModules()
      .filter((m) => isModuleEnabled(m, ctx))
      .flatMap((m) =>
        m.navLinks(ctx).map((link) => ({
          ...link,
          moduleId: m.id,
          items: visibleItems(link.items, hasPrivilege),
        }))
      )
      .filter((link) => link.link || link.items?.length);
  });
}
