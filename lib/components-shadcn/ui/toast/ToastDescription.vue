<script setup lang="ts">
import { type HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn('text-sm opacity-90', props.class)">
    <slot />
  </div>
</template>
