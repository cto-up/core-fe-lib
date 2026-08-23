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
 * Folds every link carrying the same `sectionId` into a single section.
 *
 * Without this, a module can only put an item in a shared section by
 * re-declaring the whole section, and the sidebar renders two sections with
 * the same name — which is what "Settings" did once connections moved out of
 * aiemployee-fe-lib (ADR 054).
 *
 * Two orderings, deliberately independent:
 *   - the section sits where its FIRST contributor sits in registration order,
 *     and takes its icon from that link, so adding a contributor never moves an
 *     existing section;
 *   - its items are concatenated by ascending `sectionOrder`, so a contributor
 *     can lead the section without being registered first.
 *
 * The label is not taken from any contributor: it comes from
 * `layout.navigation.<sectionId>`, because two modules cannot agree on one.
 */
export function mergeSharedSections(
  links: MenuLink[],
  t: (key: string) => string
): MenuLink[] {
  const contributions = new Map<string, MenuLink[]>();
  for (const link of links) {
    if (!link.sectionId) continue;
    const bucket = contributions.get(link.sectionId);
    if (bucket) bucket.push(link);
    else contributions.set(link.sectionId, [link]);
  }

  const emitted = new Set<string>();
  const out: MenuLink[] = [];

  for (const link of links) {
    const id = link.sectionId;
    if (!id) {
      out.push(link);
      continue;
    }
    if (emitted.has(id)) continue;
    emitted.add(id);

    const parts = [...(contributions.get(id) ?? [])].sort(
      (a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0)
    );
    out.push({
      ...link,
      title: t(`layout.navigation.${id}.title`),
      caption: t(`layout.navigation.${id}.caption`),
      items: parts.flatMap((p) => p.items ?? []),
    });
  }

  return out;
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

    const links = getModules()
      .filter((m) => isModuleEnabled(m, ctx))
      .flatMap((m) =>
        m.navLinks(ctx).map((link) => ({
          ...link,
          moduleId: m.id,
          items: visibleItems(link.items, hasPrivilege),
        }))
      );

    // Merge before the empty-section filter: a contributor whose items are all
    // privilege-filtered away must not take the shared section's label slot.
    return mergeSharedSections(links, t).filter(
      (link) => link.link || link.items?.length
    );
  });
}
