<template>
  <template v-for="item in items" :key="item.title">
    <li v-if="!item.items?.length" class="flex items-center rounded-md">
      <SidebarLink
        :title="item.title"
        :link="item.link"
        :caption="item.caption"
        :badge="item.badge"
        :icon-component="resolveIcon(item.icon)"
        :expanded="expanded"
        @click="$emit('navigate')"
      />
    </li>
    <li v-else class="space-y-1">
      <Collapsible v-model:open="openMap[item.title]">
        <CollapsibleTrigger
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
            :class="openMap[item.title] && 'rotate-180'"
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
import { ref, type Component } from "vue";
import { ChevronDown } from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import SidebarLink from "./SidebarLink.vue";
import type { MenuItem } from "../types/menu-link";

defineProps<{
  items?: MenuItem[];
  expanded: boolean;
  resolveIcon: (name?: string) => Component;
}>();

defineEmits<{ navigate: [] }>();

const openMap = ref<Record<string, boolean>>({});
</script>
