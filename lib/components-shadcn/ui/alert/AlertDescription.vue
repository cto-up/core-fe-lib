<script setup lang="ts">
import { cn } from "../../utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('text-sm [&_p]:leading-relaxed', props.class)">
    <slot />
  </div>
</template>
