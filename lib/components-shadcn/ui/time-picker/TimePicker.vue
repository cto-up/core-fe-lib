<template>
  <div :class="cn('relative', props.class)">
    <Clock
      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <MaskedTimeInput
      :id="id"
      :model-value="modelValue"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :class="
        cn(
          'flex h-9 w-full rounded-md border border-input bg-background py-1 pl-9 pr-3 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error'
        )
      "
      @update:model-value="(v) => emit('update:modelValue', v)"
    />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Clock } from "lucide-vue-next";
import { cn } from "../../utils";
import MaskedTimeInput from "../../primitives/MaskedTimeInput.vue";

// A 24-hour HH:MM field typed segment by segment. It emits "" while the time
// is incomplete or out of range, and HH:MM once it is whole.
const props = defineProps<{
  modelValue?: string;
  id?: string;
  disabled?: boolean;
  error?: boolean;
  ariaLabel?: string;
  class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
