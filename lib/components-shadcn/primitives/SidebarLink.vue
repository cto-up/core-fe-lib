<template>
  <TooltipProvider :disable-hoverable-content="true">
    <Tooltip :delay-duration="0">
      <TooltipTrigger as-child class="w-full">
        <component
          :is="link ? RouterLink : 'button'"
          :to="link ? link : undefined"
          :class="
            cn(
              'w-full overflow-x-hidden justify-start duration-150 inline-flex items-center rounded-md text-sm font-medium text-muted-foreground transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              'h-10 px-3',
              !isActive && 'hover:bg-accent hover:text-foreground',
              isActive && 'bg-primary/10 text-primary'
            )
          "
          @click="onClick"
        >
          <span class="flex items-center" :class="expanded ? 'mr-4' : 'm-0'">
            <component
              :is="iconComponent"
              v-if="iconComponent"
              class="h-4 w-4 flex-shrink-0"
            />
          </span>
          <transition name="fade" :duration="300">
            <span v-show="expanded" class="truncate">{{ title }}</span>
          </transition>
          <span
            v-if="badge && badge > 0 && expanded"
            class="ml-auto flex-shrink-0 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1 leading-none"
          >
            {{ badge > 99 ? "99+" : badge }}
          </span>
        </component>
      </TooltipTrigger>
      <TooltipContent v-if="!expanded" side="right">
        <p class="text-sm">{{ title }}</p>
        <p v-if="caption" class="text-xs text-muted-foreground">
          {{ caption }}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script lang="ts" setup>
import { computed, inject, ref, type Component, type Ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../utils";

/**
 * Generic active-state sidebar nav button.
 *
 * Icons are passed as a resolved component so this stays independent of any
 * icon-name → Lucide mapping. Callers iterating a menu-link array typically
 * run their hub-side resolver inline:
 *
 *   <SidebarLink :icon-component="resolveIcon(link.icon)" ... />
 *
 * When `expanded` is false the title and caption render in a right-side
 * tooltip (icon-only state).
 */
const props = defineProps<{
  title: string;
  link?: string;
  iconComponent?: Component;
  caption?: string;
  badge?: number;
  expanded: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();

const route = useRoute();

// All sibling nav paths (provided by AppMainSidebar) so active state resolves by
// LONGEST prefix match — a section-index link (`/lms`) yields to a more specific
// sibling (`/lms/admin/courses`) instead of both highlighting. Falls back to the
// plain prefix check when used outside AppMainSidebar.
const allLinkPaths = inject<Ref<string[]>>("sidebarLinkPaths", ref([]));

const isActive = computed(() => {
  const link = props.link;
  if (!link) return false;
  const matches = (p: string) =>
    route.path === p || route.path.startsWith(p + "/");
  if (!matches(link)) return false;
  const paths = allLinkPaths.value;
  if (!paths?.length) return true; // standalone fallback
  const longest = paths
    .filter(matches)
    .reduce((best, p) => (p.length > best.length ? p : best), "");
  return longest === link;
});

// RouterLink handles the actual navigation (and lets the browser natively
// handle cmd/ctrl/middle-click → "open in new tab"). We only forward the click
// so callers can react (e.g. close the mobile sidebar) on a plain left-click.
// Don't gate on event.defaultPrevented: RouterLink's own click handler runs
// first and calls preventDefault() for normal SPA navigation, so it is always
// true here on a real left-click — the modifier/button checks below already
// exclude the open-in-new-tab cases (which never preventDefault).
const onClick = (event: MouseEvent) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  emit("click");
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
