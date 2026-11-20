import { computed, inject, type InjectionKey, type Ref } from "vue";

/**
 * Where menus, popovers and dialogs teleport to. A host that shows part of the
 * page through the Fullscreen API provides the full-screen element here: only
 * its subtree is drawn while it is full screen, so anything teleported to
 * `body` would open invisibly behind it.
 */
export const PORTAL_TARGET: InjectionKey<Ref<HTMLElement | null>> =
  Symbol("PORTAL_TARGET");

export function usePortalTarget() {
  const target = inject(PORTAL_TARGET, null);
  return computed<string | HTMLElement>(() => target?.value ?? "body");
}
