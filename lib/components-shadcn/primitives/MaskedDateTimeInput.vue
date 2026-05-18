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

// YYYY - MM - DD   HH : MM
const segments = [
  { len: 4, placeholder: "YYYY" },
  { len: 2, placeholder: "MM", autoAdvanceOver: 1 },
  { len: 2, placeholder: "DD", autoAdvanceOver: 3 },
  { len: 2, placeholder: "HH", autoAdvanceOver: 2 },
  { len: 2, placeholder: "MM", autoAdvanceOver: 5 },
];
const separators = ["-", "-", " ", ":"];

function parseValue(val: string): string[] {
  // Accepts "YYYY-MM-DDTHH:MM" or "YYYY-MM-DD HH:MM"
  const normalized = val.replace("T", " ");
  const [datePart = "", timePart = ""] = normalized.split(" ");
  const dateParts = datePart.split("-");
  const timeParts = timePart.split(":");
  return [...dateParts, ...timeParts];
}

function buildValue(segs: string[]): string | null {
  const [y, mo, d, h, mi] = segs;
  if (
    y?.length === 4 &&
    mo?.length === 2 &&
    d?.length === 2 &&
    h?.length === 2 &&
    mi?.length === 2
  ) {
    const dateStr = `${y}-${mo}-${d}T${h}:${mi}`;
    if (!isNaN(new Date(dateStr).getTime())) return dateStr;
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
