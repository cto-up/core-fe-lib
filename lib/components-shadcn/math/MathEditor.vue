<!--
  MathEditor — write a formula without knowing LaTeX: a source field with live
  preview (errors explained inline), a searchable symbol palette (arrow keys
  move through it, Tab jumps to the next empty box), Unicode paste converted to
  LaTeX. Built on EditorShell: same save/cancel/dirty contract as every editor.
-->
<template>
  <EditorShell
    :title="title ?? t('mathEditor.title')"
    :dirty="dirty"
    :saving="saving"
    :error="saveError"
    :save-disabled="!!error || !tex.trim()"
    :panel-label="t('mathEditor.palette')"
    @save="emit('save', tex)"
    @cancel="emit('cancel')"
  >
    <div class="space-y-3 p-4">
      <label :for="fieldId" class="text-sm font-medium">{{
        t("mathEditor.source")
      }}</label>
      <textarea
        :id="fieldId"
        ref="field"
        v-model="tex"
        rows="3"
        class="w-full rounded-md border bg-background p-3 font-mono text-sm"
        :class="error ? 'border-error' : ''"
        :aria-describedby="`${fieldId}-hint`"
        spellcheck="false"
        :autofocus="autofocus"
        @keydown.tab="onTab"
        @paste="onPaste"
      />
      <p :id="`${fieldId}-hint`" class="text-xs text-muted-foreground">
        {{ t("mathEditor.sourceHint") }}
      </p>
      <section
        :aria-label="t('mathEditor.preview')"
        class="rounded-lg bg-muted/30 p-4"
      >
        <MathTex
          v-if="tex.trim()"
          :tex="tex"
          :display="display"
          show-errors
          @error="(e) => (error = e?.message ?? '')"
        />
        <p v-else class="text-center text-sm text-muted-foreground">
          {{ t("mathEditor.empty") }}
        </p>
      </section>
      <p v-if="notice" role="status" class="text-xs text-muted-foreground">
        {{ notice }}
      </p>
    </div>

    <template #panel>
      <div class="space-y-3 p-3">
        <Input
          v-model="q"
          :placeholder="t('mathEditor.search')"
          :aria-label="t('mathEditor.search')"
        />
        <p v-if="!results.length" class="text-sm text-muted-foreground">
          {{ t("mathEditor.noMatch") }}
        </p>
        <section v-for="g in grouped" :key="g.group">
          <h3 class="mb-1 text-xs font-medium text-muted-foreground">
            {{ t(`mathEditor.groups.${g.group}`) }}
          </h3>
          <div class="grid grid-cols-5 gap-1" role="grid" @keydown="onGridKey">
            <button
              v-for="m in g.items"
              :key="m.id"
              type="button"
              class="palette-key flex h-11 items-center justify-center rounded-md bg-background text-sm hover:bg-muted"
              :aria-label="m.label[lang]"
              :title="m.label[lang]"
              :tabindex="m.id === focusId ? 0 : -1"
              @focus="focusId = m.id"
              @click="insert(m.tex)"
            >
              <MathTex :tex="keyTex(m.tex)" />
            </button>
          </div>
        </section>
      </div>
    </template>
  </EditorShell>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import EditorShell from "../editor/EditorShell.vue";
import { Input } from "../ui/input";
import MathTex from "./MathTex.vue";
import {
  MATH_TEMPLATES,
  insertTemplate,
  searchTemplates,
  unicodeToTex,
  type MathTemplate,
} from "./mathTemplates";

const props = defineProps<{
  modelValue: string;
  display?: boolean;
  title?: string;
  saving?: boolean;
  saveError?: string;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [tex: string];
  save: [tex: string];
  cancel: [];
  dirty: [isDirty: boolean];
}>();

const { t, locale } = useI18n();
const lang = computed<"en" | "fr">(() =>
  String(locale.value).startsWith("fr") ? "fr" : "en"
);
const fieldId = `me${Date.now().toString(36)}`;
const field = ref<HTMLTextAreaElement | null>(null);
const initial = props.modelValue ?? "";
const texRef = ref(initial);
const tex = computed({
  get: () => texRef.value,
  set: (v: string) => {
    texRef.value = v;
    emit("update:modelValue", v);
    emit("dirty", v !== initial);
  },
});
const dirty = computed(() => texRef.value !== initial);
const error = ref("");
const notice = ref("");
const q = ref("");
const focusId = ref(MATH_TEMPLATES[0].id);
let stops: number[] = [];

const results = computed(() => searchTemplates(q.value));
const grouped = computed(() => {
  const out: { group: MathTemplate["group"]; items: MathTemplate[] }[] = [];
  for (const m of results.value) {
    let g = out.find((x) => x.group === m.group);
    if (!g) out.push((g = { group: m.group, items: [] }));
    g.items.push(m);
  }
  return out;
});

function keyTex(tpl: string): string {
  const filled = tpl.replace(/◻/g, "\\square");
  return filled.startsWith("^") || filled.startsWith("_")
    ? `x${filled}`
    : filled;
}

function insert(tpl: string) {
  const el = field.value;
  const start = el?.selectionStart ?? tex.value.length;
  const end = el?.selectionEnd ?? tex.value.length;
  const res = insertTemplate(tex.value, start, end, tpl);
  tex.value = res.text;
  stops = res.stops;
  void nextTick(() => {
    const first = stops.shift() ?? res.text.length;
    el?.focus();
    el?.setSelectionRange(first, first);
  });
}

function onTab(e: KeyboardEvent) {
  if (!stops.length || e.shiftKey) return;
  e.preventDefault();
  const next = stops.shift()!;
  field.value?.setSelectionRange(next, next);
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!/[²³¹ⁿ½¼¾×÷±·≤≥≠≈≡∞∑∏∫∂→⇒⇔∈∉∪∩∅ℝ√α-ωΔΣΩ]/.test(text)) return;
  e.preventDefault();
  const converted = unicodeToTex(text);
  const el = field.value;
  const start = el?.selectionStart ?? tex.value.length;
  const end = el?.selectionEnd ?? tex.value.length;
  tex.value = tex.value.slice(0, start) + converted + tex.value.slice(end);
  notice.value = t("mathEditor.pasted");
}

/** Arrow keys move through the palette grid (5 columns). */
function onGridKey(e: KeyboardEvent) {
  const keys = Array.from(
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
      ".palette-key"
    )
  );
  const i = keys.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 }[
    e.key
  ];
  if (!delta) return;
  e.preventDefault();
  keys[Math.max(0, Math.min(keys.length - 1, i + delta))]?.focus();
}
</script>
