<template>
  <nav
    v-if="visible.length > 1"
    data-test="view-switcher"
    :class="
      cn(
        'inline-flex h-9 items-center rounded-md bg-muted p-1 text-muted-foreground',
        props.class
      )
    "
  >
    <RouterLink
      v-for="item in visible"
      :key="item.name"
      :to="{ name: item.name }"
      :title="item.hint"
      :aria-current="isCurrent(item.name) ? 'page' : undefined"
      :class="
        cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isCurrent(item.name)
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:text-foreground'
        )
      "
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script lang="ts" setup>
import { computed, type HTMLAttributes } from "vue";
import { useRoute } from "vue-router";
import { cn } from "../utils";

export interface ViewSwitcherItem {
  /** Route NAME. Undefined means the host did not mount this view. */
  name?: string;
  label: string;
  /** Hover text. What the OTHER view answers, not a second name for it. */
  hint?: string;
}

const props = defineProps<{
  items: ViewSwitcherItem[];
  class?: HTMLAttributes["class"];
}>();

const route = useRoute();

/**
 * Two views of one subject, side by side, rather than a link buried in each
 * one pointing at the other.
 *
 * The items carry route NAMES because the pages that pair this way generally
 * live in different libraries and may not name each other's routes — the host
 * that mounts both states the names, and a name it left out simply drops out
 * here. A switcher with one destination is a label, so it is not drawn at all.
 *
 * Give it to a page OUTSIDE its loading guard. The pair is how somebody gets
 * from a screen that is still fetching, or one that failed to, to the other
 * one — which is exactly when they need it and exactly when a link rendered
 * from loaded data is not there.
 */
const visible = computed(() =>
  props.items.filter((i): i is ViewSwitcherItem & { name: string } =>
    Boolean(i.name)
  )
);

function isCurrent(name: string) {
  return route.name === name || route.matched.some((r) => r.name === name);
}
</script>
