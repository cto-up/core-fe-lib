<template>
  <div style="color: #e7e7e7" v-html="render(mdText)" />
</template>

<script setup lang="ts">
import markdownit from 'markdown-it/index.js';
import DOMPurify from 'dompurify';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { locale } = useI18n();
// enable everything
const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
});

const render = (text: string) => {
  const sanitizedHtml = DOMPurify.sanitize(md.render(text));
  return md.render(sanitizedHtml);
};
const { filename } = defineProps({
  filename: {
    type: String,
    required: true,
  },
});

// Reactive variable to store the markdown text
const mdText = ref('');

const computedFilePath = computed(
  () =>
    '/markdown/' +
    filename +
    '_' +
    (locale.value === 'fr' ? 'fr' : 'en') +
    '.md',
);

// Watch for changes in filePath and load the file
watch(
  [() => computedFilePath, () => locale.value],
  async ([newPath, newLocale]) => {
    console.log('newPath', newPath);
    console.log('newLocale', newLocale);

    if (newPath) {
      try {
        const response = await fetch(newPath.value);
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }
        mdText.value = await response.text();
      } catch (error) {
        console.error(error);
        mdText.value = 'Error loading content.';
      }
    } else {
      mdText.value = '';
    }
  },
  { immediate: true },
);
</script>
