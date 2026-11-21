<template>
  <div
    ref="host"
    class="md-raw min-h-[200px] overflow-hidden rounded-md bg-muted/40 text-sm"
    data-test="markdown-source"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
  lineNumbers,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

// The Markdown source on CodeMirror (lms LessonEditor's Markdown view, with
// line numbers). A link whose target linkMarker names (a page, a card) shows
// a marker instead of its target: the text keeps it, the caret skips it.
const props = defineProps<{
  modelValue: string;
  linkMarker?: (href: string) => string | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  focus: [];
  blur: [];
}>();
const { t } = useI18n();
const host = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

class Marker extends WidgetType {
  constructor(readonly label: string) {
    super();
  }
  eq(other: Marker) {
    return other.label === this.label;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = "md-raw-marker";
    el.textContent = this.label;
    el.setAttribute("data-test", "markdown-link-marker");
    return el;
  }
}

const TARGET = /\]\(([^)\s]+)\)/g;

function markers(v: EditorView): DecorationSet {
  const out = new RangeSetBuilder<Decoration>();
  if (!props.linkMarker) return out.finish();
  for (const { from, to } of v.visibleRanges) {
    const text = v.state.doc.sliceString(from, to);
    for (const m of text.matchAll(TARGET)) {
      const label = props.linkMarker(m[1]);
      if (!label) continue;
      const start = from + (m.index ?? 0) + 1;
      out.add(
        start,
        start + m[0].length - 1,
        Decoration.replace({ widget: new Marker(label) })
      );
    }
  }
  return out.finish();
}

const markerPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(v: EditorView) {
      this.decorations = markers(v);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = markers(u.view);
    }
  },
  {
    decorations: (p) => p.decorations,
    provide: (p) =>
      EditorView.atomicRanges.of(
        (v) => v.plugin(p)?.decorations ?? Decoration.none
      ),
  }
);

onMounted(() => {
  view = new EditorView({
    parent: host.value!,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        markerPlugin,
        EditorView.contentAttributes.of({
          "aria-label": t("editor.markdownSource"),
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) emit("update:modelValue", u.state.doc.toString());
          if (u.focusChanged && u.view.hasFocus) emit("focus");
          else if (u.focusChanged) emit("blur");
        }),
      ],
    }),
  });
});

// Someone else's change while the source is shown and not being typed in.
watch(
  () => props.modelValue,
  (value) => {
    if (!view || view.hasFocus || value === view.state.doc.toString()) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }
);

onBeforeUnmount(() => view?.destroy());
</script>

<style>
.md-raw .cm-editor {
  font-family: var(--font-mono);
  min-height: 200px;
}
.md-raw .cm-editor.cm-focused {
  outline: none;
}
.md-raw .cm-gutters {
  background: transparent;
  border: none;
  color: hsl(var(--muted-foreground) / 0.6);
}
.md-raw .cm-content {
  padding: 0.75rem 0;
}
.md-raw-marker {
  margin-left: 0.15em;
  border-radius: 999px;
  background: hsl(var(--muted));
  padding: 0 0.4em;
  font-size: 0.8em;
  color: hsl(var(--muted-foreground));
}
</style>
