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
      return "border-destructive bg-destructive text-destructive-foreground";
    case "warning":
      // Amber rather than a semantic token: the palette defines no warning
      // colour, and both halves are written explicitly so the toast is legible
      // in either theme.
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
