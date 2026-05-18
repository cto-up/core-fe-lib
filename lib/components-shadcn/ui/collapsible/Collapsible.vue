<script setup lang="ts">
import {
  CollapsibleRoot,
  type CollapsibleRootProps,
  type CollapsibleRootEmits,
  useForwardPropsEmits,
} from "radix-vue";
import { type HTMLAttributes } from "vue";

const props = defineProps<
  CollapsibleRootProps & { class?: HTMLAttributes["class"] }
>();

const emits = defineEmits<CollapsibleRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <CollapsibleRoot v-bind="forwarded" :class="props.class">
    <slot />
  </CollapsibleRoot>
</template>
