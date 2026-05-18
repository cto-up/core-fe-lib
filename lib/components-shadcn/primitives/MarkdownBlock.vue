<template>
  <div
    class="prose prose-sm max-w-none dark:prose-invert"
    v-html="renderedMarkdown"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = defineProps({
  content: {
    type: String,
    required: true,
    default: "",
  },
});

const renderedMarkdown = computed(() => {
  try {
    const html = marked.parse(props.content) as string;
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return "";
  }
});
</script>
