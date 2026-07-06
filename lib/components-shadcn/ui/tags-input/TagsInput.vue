<script setup lang="ts">
import { ref, type HTMLAttributes } from "vue";
import { useVModel } from "@vueuse/core";
import { X } from "lucide-vue-next";
import { Badge } from "../badge";
import { cn } from "../../utils";

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    placeholder?: string;
    disabled?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  { modelValue: () => [], placeholder: "", disabled: false, class: undefined }
);

const emits = defineEmits<{
  (e: "update:modelValue", payload: string[]): void;
}>();

const tags = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: [],
}) as unknown as { value: string[] };

const draft = ref("");

// Commit the current draft (or an explicit value) as a tag: trimmed, non-empty
// and de-duplicated case-insensitively.
function commit(raw = draft.value) {
  draft.value = "";
  const next = raw.trim();
  if (!next) return;
  const exists = tags.value.some((t) => t.toLowerCase() === next.toLowerCase());
  if (!exists) tags.value = [...tags.value, next];
}

function removeAt(i: number) {
  tags.value = tags.value.filter((_, idx) => idx !== i);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    commit();
  } else if (e.key === "Backspace" && !draft.value && tags.value.length) {
    removeAt(tags.value.length - 1);
  }
}

// Paste a comma/newline list at once — split and commit each token.
function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text") ?? "";
  if (!/[\n,]/.test(text)) return;
  e.preventDefault();
  text.split(/[\n,]/).forEach((t) => commit(t));
}
</script>

<template>
  <div
    :class="
      cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        props.class
      )
    "
    @click="!disabled && ($refs.field as HTMLInputElement)?.focus()"
  >
    <Badge
      v-for="(tag, i) in tags"
      :key="`${tag}-${i}`"
      variant="secondary"
      class="gap-1"
    >
      {{ tag }}
      <button
        v-if="!disabled"
        type="button"
        class="-mr-0.5 rounded-full hover:text-destructive"
        :aria-label="`Remove ${tag}`"
        @click.stop="removeAt(i)"
      >
        <X class="h-3 w-3" />
      </button>
    </Badge>
    <input
      ref="field"
      v-model="draft"
      type="text"
      class="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      :placeholder="tags.length ? '' : placeholder"
      :disabled="disabled"
      @keydown="onKeydown"
      @paste="onPaste"
      @blur="commit()"
    />
  </div>
</template>
