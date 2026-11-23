<script setup lang="ts">
import { CollapsibleTrigger, type CollapsibleTriggerProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  CollapsibleTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drops class
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <CollapsibleTrigger v-bind="delegatedProps" :class="props.class">
    <slot />
  </CollapsibleTrigger>
</template>
