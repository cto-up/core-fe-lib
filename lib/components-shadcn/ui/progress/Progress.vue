<template>
  <div
    :class="
      cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        props.class
      )
    "
  >
    <div
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - (modelValue || 0)}%)` }"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from "../../utils";

const props = defineProps<{
  modelValue?: number;
  class?: string;
}>();
</script>
