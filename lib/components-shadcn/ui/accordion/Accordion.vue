<script setup lang="ts">
import { AccordionRoot, type AccordionRootProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  AccordionRootProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <AccordionRoot v-bind="delegatedProps" :class="cn('', props.class)">
    <slot />
  </AccordionRoot>
</template>
