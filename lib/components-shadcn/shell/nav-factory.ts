import { computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useTenantStore } from "../../stores/tenant-store";
import { useUserStore } from "../../stores/user-store";
import { useUrl } from "../../composables/useUrl";
import type { MenuLink } from "../types/menu-link";
import type { AppContext } from "./types";
import { isModuleEnabled } from "./feature-gate";
import { getModules } from "./registry";

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

    return getModules()
      .filter((m) => isModuleEnabled(m, ctx))
      .flatMap((m) =>
        m.navLinks(ctx).map((link) => ({ ...link, moduleId: m.id }))
      );
  });
}
