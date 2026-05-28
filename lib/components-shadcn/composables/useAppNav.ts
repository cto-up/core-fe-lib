import { computed, type ComputedRef } from "vue";
import { useShellNav } from "../shell/nav-factory";
import type { MenuLink } from "../types/menu-link";
import type {
  SidebarMenuSection,
  SidebarTopSection,
  SidebarSubGroup,
} from "../primitives/AppMainSidebar.vue";

export interface UseAppNavOptions {
  /** Optional top section above the module nav (e.g. super-admin entries). */
  topSection?: () => SidebarTopSection | undefined;
  /** Optional trailing sections after the module nav (e.g. tenant admin). */
  trailingSections?: () => SidebarMenuSection[];
  /** Privilege-gated sub-groups rendered inside module sections. */
  subGroups?: () => SidebarSubGroup[];
  /** Privilege predicate used by AppMainSidebar's sub-group filter. */
  canAccess?: (privilege: unknown) => boolean;
  /** Optional post-assembly transform — host apps use this to reshape the
   *  flat module-link list (e.g. wrap several modules into one group). */
  menuLinksTransform?: (links: MenuLink[]) => MenuLink[];
}

/**
 * Aggregates the sidebar nav config from `useShellNav` (the module registry)
 * plus optional caller-supplied top/trailing sections and sub-groups.
 *
 * Returns the exact shape `AppMainSidebar` consumes via its props.
 */
export function useAppNav(opts: UseAppNavOptions = {}) {
  const rawLinks = useShellNav();
  const menuLinks = computed(() => {
    const links = rawLinks.value;
    return opts.menuLinksTransform ? opts.menuLinksTransform(links) : links;
  }) as unknown as ComputedRef<SidebarMenuSection[]>;
  return {
    menuLinks,
    topSection: computed(() => opts.topSection?.()),
    trailingSections: computed(() => opts.trailingSections?.() ?? []),
    subGroups: computed(() => opts.subGroups?.() ?? []),
    canAccess: opts.canAccess ?? (() => true),
  };
}

export type AppNav = ReturnType<typeof useAppNav>;
