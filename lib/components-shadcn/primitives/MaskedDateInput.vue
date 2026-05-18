<template>
  <input
    ref="inputRef"
    type="text"
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

// YYYY - MM - DD
const segments = [
  { len: 4, placeholder: "YYYY" },
  { len: 2, placeholder: "MM", autoAdvanceOver: 1 }, // first digit > 1 → pad "0X"
  { len: 2, placeholder: "DD", autoAdvanceOver: 3 }, // first digit > 3 → pad "0X"
];
const separators = ["-", "-"];

function parseValue(val: string): string[] {
  // Strip time portion and split on any separator
  const datePart = val.split(/[T ]/)[0];
  return datePart.replace(/[/.]/g, "-").split("-");
}

function buildValue(segs: string[]): string | null {
  const [y, m, d] = segs;
  if (y?.length === 4 && m?.length === 2 && d?.length === 2) {
    const dateStr = `${y}-${m}-${d}`;
    if (!isNaN(new Date(dateStr + "T00:00:00").getTime())) return dateStr;
  }
  return null;
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
