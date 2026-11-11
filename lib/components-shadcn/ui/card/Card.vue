<!-- eslint-disable vue/multi-word-component-names -- shadcn primitive name -->
<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  /** A hero card (sign-in, setup checklist, empty state): a 2px line across
   *  the top edge in the product's --card-rail. */
  rail?: boolean;
}>();
</script>

<template>
  <!-- Soft ambient depth instead of a hard border by default. Structural
       surfaces that need a crisp edge opt back in with class="border". -->
  <div
    :class="
      cn(
        'rounded-lg bg-card text-card-foreground shadow-ambient',
        props.rail &&
          'relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-rail before:content-[\'\']',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
