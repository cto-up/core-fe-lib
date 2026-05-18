<template>
  <h1 :class="cn('text-3xl font-bold tracking-tight', props.class)">
    <slot />
  </h1>
</template>

<script lang="ts" setup>
import { cn } from "../utils";

const props = defineProps({
  class: {
    type: String,
    required: false,
  },
});
</script>
