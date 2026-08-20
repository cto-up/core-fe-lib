<script setup lang="ts">
import {
  AccordionRoot,
  type AccordionRootEmits,
  type AccordionRootProps,
  useForwardPropsEmits,
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  AccordionRootProps & { class?: HTMLAttributes["class"] }
>();
// Declaring the emits is what makes `v-model` work on this wrapper. Without
// them, passing `modelValue` still switched radix into controlled mode while
// `update:modelValue` never reached the parent — the open set froze at its
// initial value and every click was silently discarded.
const emits = defineEmits<AccordionRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <AccordionRoot v-bind="forwarded" :class="cn('', props.class)">
    <slot />
  </AccordionRoot>
</template>
