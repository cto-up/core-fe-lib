<template>
  <q-page class="q-pa-md">
    <q-tabs v-model="activeTab" align="justify" class="text-grey-9">
      <q-tab name="view" no-caps icon="visibility" />
      <q-tab name="edit" no-caps icon="edit" />
      <q-tab name="code" no-caps icon="code" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated>
      <!-- View Tab -->
      <q-tab-panel name="view">
        <slot name="top"> </slot>
        <div class="q-pa-md markdown-body" v-html="render(mdText)" />
        <slot name="bottom"> </slot>
      </q-tab-panel>

      <!-- Edit Tab -->
      <q-tab-panel name="edit">
        <markdown-editor
          :initial-content="mdText"
          :active-buttons="[
            'bold',
            'italic',
            'strike',
            'underline',
            'code',
            'h1',
            'h2',
            'h3',
            'bulletList',
            'orderedList',
            'blockquote',
            'codeBlock',
            'horizontalRule',
            'undo',
            'redo',
          ]"
          @update="
            ($event) => {
              mdText = $event;
              $emit('update:modelValue', $event);
            }
          "
        />
      </q-tab-panel>
      <!-- Edit Tab -->
      <q-tab-panel name="code">
        <q-input
          v-model="mdText"
          type="textarea"
          outlined
          filled
          rows="20"
          label="Edit Markdown"
          @update:model-value="$emit('update:modelValue', mdText)"
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import markdownit from "markdown-it";
import MarkdownEditor from "./MarkdownEditor.vue";
import DOMPurify from "dompurify";

// Set up Markdown-it with all features enabled
const md = markdownit({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

const render = (text: string) => {
  const sanitizedHtml = DOMPurify.sanitize(md.render(text));
  return md.render(sanitizedHtml);
};

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

defineEmits(["update:modelValue"]);

// Reactive variable to store the markdown text (editable)
const mdText = ref<string>(props.modelValue ?? "");

watch(
  () => props.modelValue,
  (newValue) => {
    mdText.value = newValue ?? "";
  }
);

// Tracks the active tab (view or edit)
const activeTab = ref<string>("view");
</script>

<style lang="scss" scoped>
.q-page {
  max-width: 800px;
  margin: 0 auto;
}

.q-input textarea {
  font-family: monospace;
  font-size: 1rem;
}

.q-tab-panel {
  padding: 16px;
}
/* Clear Quasar styles for the markdown body */
.markdown-body :deep(*) {
  // all: unset; /* Unset all inherited styles */
  font-family: "Arial", sans-serif; /* Re-define your desired font */
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote) {
  all: unset; /* Remove Quasar styles */
  margin: 0;
  padding: 0;
}

.markdown-body :deep(h1) {
  font-size: 1.5em;
}
.markdown-body :deep(h2) {
  font-size: 1.3em;
}
.markdown-body :deep(h3) {
  font-size: 1em;
}
.markdown-body :deep(hr) {
  opacity: 0.1;
}

.markdown-body :deep(pre),
.markdown-body :deep(code) {
  padding: 8px;
  border-radius: 4px;
  font-family: "Courier New", Courier, monospace;
}
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse; /* Ensures no double borders */
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #373737; /* Border for table cells */
  padding: 8px; /* Spacing inside cells */
  text-align: left; /* Align text to the left */
}

.markdown-body :deep(th) {
  background-color: #2e2e2e; /* Light gray header */
  font-weight: bold;
}

.markdown-body :deep(tr:nth-child(even)) {
  background-color: #202020; /* Zebra stripe for rows */
}

.markdown-body :deep(tr:hover) {
  background-color: #15233d; /* Highlight on hover */
}
</style>
