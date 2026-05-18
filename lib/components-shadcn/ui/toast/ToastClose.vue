<script setup lang="ts">
import { X } from "lucide-vue-next";
import { cn } from "../../utils";
import { type HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <button
    :class="
      cn(
        'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
        props.class
      )
    "
    @click="emit('close')"
  >
    <X class="h-4 w-4" />
  </button>
</template>
