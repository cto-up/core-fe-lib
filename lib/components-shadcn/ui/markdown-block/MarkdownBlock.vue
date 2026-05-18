<template>
  <div v-if="loading" class="flex items-center justify-center py-8">
    <Loader2 class="h-8 w-8 animate-spin text-primary" />
  </div>
  <div v-else-if="error" class="text-center py-8 text-destructive">
    <AlertCircle class="h-8 w-8 mx-auto mb-2" />
    <p>{{ error }}</p>
  </div>
  <div
    v-else
    class="prose dark:prose-invert max-w-none"
    v-html="renderedContent"
  />
</template>

<script setup lang="ts">
import markdownit from "markdown-it";
import DOMPurify from "dompurify";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2, AlertCircle } from "lucide-vue-next";

const { locale } = useI18n();

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
});

const props = defineProps<{
  filename: string;
}>();

const mdText = ref("");
const loading = ref(false);
const error = ref("");

const computedFilePath = computed(
  () => `/markdown/${props.filename}_${locale.value === "fr" ? "fr" : "en"}.md`
);

const renderedContent = computed(() => {
  if (!mdText.value) return "";
  const rendered = md.render(mdText.value);
  return DOMPurify.sanitize(rendered);
});

const loadMarkdown = async (path: string) => {
  if (!path) {
    mdText.value = "";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }
    mdText.value = await response.text();
  } catch (err) {
    console.error("Error loading markdown:", err);
    error.value = "Error loading content.";
    mdText.value = "";
  } finally {
    loading.value = false;
  }
};

watch(
  [computedFilePath, locale],
  ([newPath]) => {
    loadMarkdown(newPath);
  },
  { immediate: true }
);
</script>

<style>
/* Tailwind Typography styles are applied via prose class */
</style>
