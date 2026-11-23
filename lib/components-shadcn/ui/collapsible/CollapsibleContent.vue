<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  CollapsibleContentProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drops class
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <CollapsibleContent v-bind="delegatedProps" :class="props.class">
    <slot />
  </CollapsibleContent>
</template>
