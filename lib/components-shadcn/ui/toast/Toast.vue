<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "../../utils";
import type { ToastVariant } from "./use-toast";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  variant?: ToastVariant;
}>();

const variantStyles = computed(() => {
  switch (props.variant) {
    case "destructive":
      // Orange, never red. Red is `--destructive`, and it belongs to the button
      // that is about to destroy something, so it keeps its alarm value; a toast
      // only reports what already happened.
      return "border-error bg-error text-error-foreground";
    case "fault":
      // Something broke on our side. Same orange, tinted rather than filled —
      // the left rule and the CircleAlert icon separate "we're on it" from the
      // amber "you can fix this" case at a glance.
      return "border-error/40 border-l-4 border-l-error bg-error/10 text-error";
    case "warning":
      // The user can act on this and it is reversible, so it sits one step below
      // `error`. Amber literals rather than `--warning`, whose foreground is
      // white: this needs dark-on-tint in light mode and the reverse in dark.
      return "border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
    default:
      return "border bg-background text-foreground";
  }
});
</script>

<template>
  <div
    :class="
      cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        variantStyles,
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
