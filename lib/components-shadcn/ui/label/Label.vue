<!-- eslint-disable vue/multi-word-component-names -- shadcn primitive name -->
<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { Label, type LabelProps } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drops class
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'text-[length:var(--label-size,0.875rem)] font-medium leading-none [font-family:var(--label-font,inherit)] [letter-spacing:var(--label-tracking,normal)] [text-transform:var(--label-case,none)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class
      )
    "
  >
    <slot />
  </Label>
</template>
