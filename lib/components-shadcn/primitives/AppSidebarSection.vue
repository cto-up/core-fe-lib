<template>
  <div class="border-b transition-all" :class="expanded ? 'p-4' : 'p-2'">
    <Collapsible :open="effectiveOpen" @update:open="onOpenChange">
      <CollapsibleTrigger
        v-show="expanded"
        class="w-full flex items-center justify-between mb-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <span class="flex items-center gap-2 min-w-0">
          <slot name="icon" />
          <span class="uppercase text-xs font-medium tracking-wider truncate">
            {{ title }}
          </span>
        </span>
        <ChevronDown
          class="h-4 w-4 flex-shrink-0 transition-transform duration-200"
          :class="effectiveOpen && 'rotate-180'"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul class="space-y-1">
          <slot :expanded="expanded" />
        </ul>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronDown } from "lucide-vue-next";

/**
 * Generic collapsible sidebar section.
 *
 * - When the sidebar is collapsed (icon-only), the section is forced open so
 *   icons remain reachable. The persisted toggle only fires when expanded.
 * - Items are provided via the default scoped slot (`:expanded`) so the
 *   consumer renders its own MenuLink/SidebarLink type.
 * - The icon is a slot (not a string name) so callers stay independent of any
 *   icon library indirection in core-fe-lib.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    expanded: boolean;
    open?: boolean;
  }>(),
  { open: true }
);

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const effectiveOpen = computed(() => (props.expanded ? props.open : true));

function onOpenChange(value: boolean) {
  if (!props.expanded) return;
  emit("update:open", value);
}
</script>
