<template>
  <!-- The app shell's primary navigation on a phone. Without it every
       destination sits behind the drawer, which is two taps and a context
       switch for what should be the primary gesture — the single loudest
       signal that a standalone-display PWA is really a website in a browser.
       z-40 matches the top bar: above the page, below any sheet or dialog. -->
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t bg-header-background/85 backdrop-blur-lg md:hidden"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
    :aria-label="label"
  >
    <ul class="flex items-stretch">
      <li v-for="tab in tabs" :key="tab.to" class="flex-1">
        <button
          type="button"
          class="flex h-14 w-full touch-manipulation flex-col items-center justify-center gap-0.5 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          :class="
            isActive(tab)
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          "
          :aria-current="isActive(tab) ? 'page' : undefined"
          @click="go(tab)"
        >
          <component
            :is="tab.icon"
            class="h-5 w-5 shrink-0"
            :stroke-width="isActive(tab) ? 2.25 : 1.75"
          />
          <!-- Truncated rather than wrapped: a two-line label makes one tab
               taller than its neighbours and the row stops reading as a row. -->
          <span
            class="max-w-full truncate text-[0.65rem] font-medium leading-none"
          >
            {{ tab.label }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
// Opt-in: an app that passes no tabs renders no bar and is unaffected. The tabs
// are the consuming app's own destinations — this component owns the shape, the
// safe-area inset and the active state, never the list.
import type { Component } from "vue";
import { useRoute, useRouter } from "vue-router";

export interface MobileTab {
  /** Route path to navigate to, and the prefix that marks the tab active. */
  to: string;
  label: string;
  icon: Component;
  /**
   * Match the path exactly. A section root like `/lms` needs this, or every
   * deeper route (`/lms/study`) would light it up as well as its own tab.
   */
  exact?: boolean;
}

const props = withDefaults(
  defineProps<{ tabs: MobileTab[]; label?: string }>(),
  { label: "Primary" }
);

const route = useRoute();
const router = useRouter();

function isActive(tab: MobileTab): boolean {
  if (tab.exact) return route.path === tab.to;
  return route.path === tab.to || route.path.startsWith(`${tab.to}/`);
}

function go(tab: MobileTab) {
  if (isActive(tab)) return;
  void router.push(tab.to);
}

defineExpose({ tabs: props.tabs });
</script>
