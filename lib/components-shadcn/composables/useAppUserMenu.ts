import { computed, type ComputedRef } from "vue";
import type { UserMenuItem } from "../primitives/AppUserMenu.vue";

/**
 * Tiny convenience wrapper: takes a factory returning the user-menu items
 * (so labels/actions can pick up reactive i18n + router refs) and returns
 * the shape `AppUserMenu` consumes.
 */
export function useAppUserMenu(
  items: () => UserMenuItem[]
): { items: ComputedRef<UserMenuItem[]> } {
  return { items: computed(() => items()) };
}
