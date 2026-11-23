<template>
  <div
    ref="root"
    role="radiogroup"
    :aria-label="label"
    :class="
      cn(
        'inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground',
        props.class
      )
    "
    data-test="segmented-control"
    @keydown="onKey"
  >
    <button
      v-for="(o, i) in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="o.value === modelValue"
      :tabindex="o.value === modelValue ? 0 : -1"
      :data-index="i"
      :data-test="`segment-${o.value}`"
      :class="
        cn(
          'inline-flex min-h-9 flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          o.value === modelValue
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:text-foreground'
        )
      "
      @click="pick(o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="V extends string">
import { nextTick, ref, type HTMLAttributes } from "vue";
import { cn } from "../utils";

/**
 * One choice among a few, in place (List | Calendar, Day | Week | Month).
 * For two pages of one subject, each with its own route, use ViewSwitcher.
 */
const props = defineProps<{
  modelValue: V;
  options: { value: V; label: string }[];
  label?: string;
  class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{ "update:modelValue": [value: V] }>();
const root = ref<HTMLElement>();

function pick(v: V) {
  if (v !== props.modelValue) emit("update:modelValue", v);
}

async function onKey(e: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
    e.key
  ];
  if (!step) return;
  e.preventDefault();
  const n = props.options.length;
  const i = props.options.findIndex((o) => o.value === props.modelValue);
  const j = (i + step + n) % n;
  pick(props.options[j].value);
  await nextTick();
  root.value?.querySelector<HTMLElement>(`[data-index="${j}"]`)?.focus();
}
</script>
