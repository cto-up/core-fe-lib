import { computed, type ComputedRef } from "vue";
import { useShellNav } from "../shell/nav-factory";
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
}

/**
 * Aggregates the sidebar nav config from `useShellNav` (the module registry)
 * plus optional caller-supplied top/trailing sections and sub-groups.
 *
 * Returns the exact shape `AppMainSidebar` consumes via its props.
 */
export function useAppNav(opts: UseAppNavOptions = {}) {
  const menuLinks = useShellNav() as unknown as ComputedRef<
    SidebarMenuSection[]
  >;
  return {
    menuLinks,
    topSection: computed(() => opts.topSection?.()),
    trailingSections: computed(() => opts.trailingSections?.() ?? []),
    subGroups: computed(() => opts.subGroups?.() ?? []),
    canAccess: opts.canAccess ?? (() => true),
  };
}

export type AppNav = ReturnType<typeof useAppNav>;
