<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../../utils";

interface Props {
  variant?: "default" | "destructive";
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
});

const alertClasses = computed(() =>
  cn(
    "relative w-full rounded-lg border p-4",
    {
      "bg-background text-foreground": props.variant === "default",
      "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive":
        props.variant === "destructive",
    },
    props.class
  )
);
</script>

<template>
  <div :class="alertClasses" role="alert">
    <slot />
  </div>
</template>
