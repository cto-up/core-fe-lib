<template>
  <div :class="cn(props.class)">
    <slot />
  </div>
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
