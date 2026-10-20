<template>
  <input
    ref="inputRef"
    type="text"
    inputmode="numeric"
    :value="display"
    :disabled="disabled"
    v-bind="$attrs"
    @keydown="onKeydown"
    @click="onClick"
    @focus="onFocus"
    @paste.prevent="onPaste"
  />
</template>

<script setup lang="ts">
import { useDateSegmentInput } from "./useDateSegmentInput";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// HH : MM, 24-hour
const segments = [
  { len: 2, placeholder: "HH", autoAdvanceOver: 2 },
  { len: 2, placeholder: "MM", autoAdvanceOver: 5 },
];
const separators = [":"];

function parseValue(val: string): string[] {
  return val.slice(0, 5).split(":");
}

function buildValue(segs: string[]): string | null {
  const [h, m] = segs;
  if (h?.length !== 2 || m?.length !== 2) return null;
  if (Number(h) > 23 || Number(m) > 59) return null;
  return `${h}:${m}`;
}

const { inputRef, display, onFocus, onClick, onKeydown, onPaste } =
  useDateSegmentInput(
    () => props.modelValue,
    (val) => emit("update:modelValue", val),
    segments,
    separators,
    parseValue,
    buildValue
  );
</script>
