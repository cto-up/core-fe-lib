<template>
  <template v-for="item in items" :key="keyOf(item)">
    <li v-if="!item.items?.length" class="flex items-center rounded-md">
      <SidebarLink
        :title="item.title"
        :link="item.link"
        :active-paths="item.activePaths"
        :caption="item.caption"
        :badge="item.badge"
        :icon-component="resolveIcon(item.icon)"
        :expanded="expanded"
        @click="$emit('navigate')"
      />
    </li>
    <li v-else class="space-y-1">
      <Collapsible
        :open="!!openMap[keyOf(item)]"
        @update:open="openMap[keyOf(item)] = $event"
      >
        <!-- A parent with its own page: the label navigates, the chevron
             alone toggles, so opening the branch never leaves the page. -->
        <div v-if="item.link" class="flex items-center rounded-md">
          <div class="min-w-0 flex-1">
            <SidebarLink
              :title="item.title"
              :link="item.link"
              :active-paths="item.activePaths"
              :caption="item.caption"
              :badge="item.badge"
              :icon-component="resolveIcon(item.icon)"
              :expanded="expanded"
              @click="$emit('navigate')"
            />
          </div>
          <CollapsibleTrigger
            v-show="expanded"
            class="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="item.title"
          >
            <ChevronDown
              class="h-4 w-4 transition-transform duration-200"
              :class="openMap[keyOf(item)] && 'rotate-180'"
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleTrigger
          v-else
          class="flex items-center w-full justify-start rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          :class="!expanded && 'px-2'"
        >
          <component
            :is="resolveIcon(item.icon)"
            class="h-4 w-4 flex-shrink-0"
            :class="expanded && 'mr-2'"
          />
          <span v-show="expanded" class="truncate text-left flex-1">
            {{ item.title }}
          </span>
          <ChevronDown
            v-show="expanded"
            class="ml-auto h-4 w-4 transition-transform duration-200"
            :class="openMap[keyOf(item)] && 'rotate-180'"
          />
        </CollapsibleTrigger>
        <CollapsibleContent class="space-y-1 pl-4 pt-1">
          <ul class="space-y-1">
            <SidebarItemTree
              :items="item.items"
              :expanded="expanded"
              :resolve-icon="resolveIcon"
              @navigate="$emit('navigate')"
            />
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  </template>
</template>

<script lang="ts" setup>
import { ref, watch, type Component } from "vue";
import { useRoute } from "vue-router";
import { ChevronDown } from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import SidebarLink from "./SidebarLink.vue";
import type { MenuItem } from "../types/menu-link";

const props = defineProps<{
  items?: MenuItem[];
  expanded: boolean;
  resolveIcon: (name?: string) => Component;
}>();

defineEmits<{ navigate: [] }>();

const openMap = ref<Record<string, boolean>>({});

const keyOf = (item: MenuItem) => item.id ?? item.title;

const route = useRoute();

// A branch holds the current page when its own link is the page, or any
// descendant's link (or activePaths) is a prefix of it.
function holdsRoute(item: MenuItem, path: string): boolean {
  const under = (p: string) => path === p || path.startsWith(p + "/");
  const descendant = (it: MenuItem): boolean =>
    [it.link, ...(it.activePaths ?? [])].some((p) => !!p && under(p)) ||
    (it.items ?? []).some(descendant);
  return item.link === path || (item.items ?? []).some(descendant);
}

// Open the branch that holds the current page, on navigation and when the
// rows arrive late (generated from fetched data). Only ever opens: a branch
// the user closed elsewhere stays closed.
watch(
  [() => route?.path, () => props.items],
  ([path]) => {
    if (!path) return;
    for (const item of props.items ?? []) {
      if (item.items?.length && holdsRoute(item, path))
        openMap.value[keyOf(item)] = true;
    }
  },
  { immediate: true }
);
</script>
