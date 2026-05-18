<script setup lang="ts">
import { type HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn('text-sm font-semibold', props.class)">
    <slot />
  </div>
</template>
