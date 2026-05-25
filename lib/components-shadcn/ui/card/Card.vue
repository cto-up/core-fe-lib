<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <!-- Soft ambient depth instead of a hard border by default. Structural
       surfaces that need a crisp edge opt back in with class="border". -->
  <div
    :class="
      cn('rounded-lg bg-card text-card-foreground shadow-ambient', props.class)
    "
  >
    <slot />
  </div>
</template>
