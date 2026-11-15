<!--
  MathTex — a LaTeX formula, typeset by KaTeX (loaded on first use) and coloured
  by the theme (--math-ink). Learners never see error UI: an invalid formula
  shows its source in mono. With `show-errors` (editors and previews) the reason
  appears inline under it. Long display formulas scroll inside their own box.
-->
<template>
  <span v-if="!display" class="math-tex math-inline" :aria-label="label">
    <span
      v-if="html"
      style="color: var(--math-ink, currentColor)"
      v-html="html"
    />
    <code v-else class="font-mono text-[0.95em]">{{ tex }}</code>
  </span>
  <div v-else class="math-tex math-display w-full min-w-0">
    <div
      class="overflow-x-auto py-1"
      style="color: var(--math-ink, currentColor)"
      :aria-label="label"
    >
      <div v-if="html" class="text-center" v-html="html" />
      <pre v-else class="whitespace-pre-wrap text-center font-mono text-sm">{{
        tex
      }}</pre>
    </div>
    <p v-if="showErrors && error" class="mt-1 text-xs text-error" role="status">
      {{ error.message }}
    </p>
  </div>
  <p
    v-if="!display && showErrors && error"
    class="text-xs text-error"
    role="status"
  >
    {{ error.message }}
  </p>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { renderTex, type TexError } from "./mathRender";

const props = defineProps<{
  tex: string;
  display?: boolean;
  /** Spoken name; defaults to KaTeX's MathML for screen readers. */
  label?: string;
  macros?: Record<string, string>;
  showErrors?: boolean;
}>();

const emit = defineEmits<{ error: [error: TexError | null] }>();

const html = ref("");
const error = ref<TexError | null>(null);

watch(
  () => [props.tex, props.display, props.macros] as const,
  async () => {
    const res = await renderTex(props.tex ?? "", {
      display: !!props.display,
      macros: props.macros,
    });
    html.value = res.html;
    error.value = res.error ?? null;
    emit("error", error.value);
  },
  { immediate: true }
);
</script>

<style>
.math-tex .katex-display {
  margin: 0;
}
.math-tex .katex {
  font-size: 1.1em;
}
</style>
