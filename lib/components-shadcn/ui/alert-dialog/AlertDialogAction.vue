<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { AlertDialogAction, type AlertDialogActionProps } from "radix-vue";
import { buttonVariants, type ButtonVariants } from "../button";
import { cn } from "../../utils";

const props = defineProps<
  AlertDialogActionProps & {
    class?: HTMLAttributes["class"];
    variant?: ButtonVariants["variant"];
  }
>();

const delegatedProps = computed(() => {
  const { class: _, variant: __, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <AlertDialogAction
    v-bind="delegatedProps"
    :class="cn(buttonVariants({ variant }), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>
