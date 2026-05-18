<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import {
  SelectIcon,
  SelectTrigger,
  type SelectTriggerProps,
  useForwardProps,
} from "radix-vue";
import { ChevronDown } from "lucide-vue-next";
import { cn } from "../../utils";
import { type VariantProps, cva } from "class-variance-authority";

const selectTriggerVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  {
    variants: {
      variant: {
        default: "border border-input bg-background px-3 py-2",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-transparent px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>;

const props = defineProps<
  SelectTriggerProps & {
    class?: HTMLAttributes["class"];
    variant?: SelectTriggerVariants["variant"];
  }
>();

const delegatedProps = computed(() => {
  const { class: _, variant: __, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(selectTriggerVariants({ variant: props.variant }), props.class)"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="w-4 h-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
