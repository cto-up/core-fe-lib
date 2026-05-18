<script setup lang="ts">
import { CollapsibleTrigger, type CollapsibleTriggerProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  CollapsibleTriggerProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <CollapsibleTrigger v-bind="delegatedProps" :class="props.class">
    <slot />
  </CollapsibleTrigger>
</template>
