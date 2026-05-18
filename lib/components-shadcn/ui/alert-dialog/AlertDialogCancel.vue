<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { AlertDialogCancel, type AlertDialogCancelProps } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  AlertDialogCancelProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <AlertDialogCancel
    v-bind="delegatedProps"
    :class="
      cn(
        'inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        props.class
      )
    "
  >
    <slot />
  </AlertDialogCancel>
</template>
