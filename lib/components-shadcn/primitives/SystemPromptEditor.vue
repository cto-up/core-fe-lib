<script setup lang="ts">
import { Textarea } from "../ui/textarea";

// A system-prompt input framed as a code editor: a file-bar header over a
// dark mono surface so Markdown instructions read as "source". Shared by the
// AI employee Setup form and the sub-agent dialog. `disabled` dims the surface
// to signal read-only (e.g. a sub-agent's prompt in flat 'agent' mode).
withDefaults(
  defineProps<{
    modelValue: string;
    filename?: string;
    fileBarRight?: string;
    placeholder?: string;
    rows?: number | string;
    disabled?: boolean;
    id?: string;
  }>(),
  {
    filename: "system_instructions.md",
    fileBarRight: "UTF-8",
    placeholder: "",
    rows: 12,
    disabled: false,
    id: undefined,
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="rounded-xl border overflow-hidden shadow-sm">
    <div
      class="flex items-center justify-between border-b bg-muted px-4 py-2 text-xs font-mono text-muted-foreground"
    >
      <span>{{ filename }}</span>
      <span>{{ fileBarRight }}</span>
    </div>
    <Textarea
      :id="id"
      :model-value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="block w-full resize-y rounded-none border-0 bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
      @update:model-value="(v) => $emit('update:modelValue', String(v))"
    />
  </div>
</template>
