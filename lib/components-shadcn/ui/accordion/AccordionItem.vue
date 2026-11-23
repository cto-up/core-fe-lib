<script setup lang="ts">
import { AccordionItem, type AccordionItemProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  AccordionItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drops class
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <AccordionItem v-bind="delegatedProps" :class="cn('border-b', props.class)">
    <slot />
  </AccordionItem>
</template>
