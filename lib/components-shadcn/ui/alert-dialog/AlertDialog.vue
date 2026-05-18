<script setup lang="ts">
import { AlertDialogRoot } from "radix-vue";

interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
}

const props = defineProps<AlertDialogProps>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();
</script>

<template>
  <AlertDialogRoot
    :open="props.open"
    :default-open="props.defaultOpen"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </AlertDialogRoot>
</template>
