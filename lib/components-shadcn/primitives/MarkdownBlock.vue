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

/**
 * A Markdown table is as wide as its columns need to be, so on a narrow column
 * (a chat bubble, a lesson on a phone) it pushes its whole container sideways.
 * Giving the table itself `overflow-x: auto` does not fix that: a block-level
 * <table> generates an anonymous inner table box that shrink-to-fits, so the
 * table stops filling its column. The wrapper is the only shape that both
 * scrolls when it must and stretches when it can.
 *
 * Done on the sanitized HTML rather than through a `marked` renderer override
 * so it does not have to track marked's renderer signature across majors.
 */
function wrapTables(html: string): string {
  if (typeof document === "undefined" || !html.includes("<table")) return html;
  const host = document.createElement("div");
  host.innerHTML = html;
  for (const table of Array.from(host.querySelectorAll("table"))) {
    if (table.parentElement?.classList.contains("md-table-scroll")) continue;
    const wrap = document.createElement("div");
    wrap.className = "md-table-scroll";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  }
  return host.innerHTML;
}

const renderedMarkdown = computed(() => {
  try {
    const html = marked.parse(props.content) as string;
    return wrapTables(DOMPurify.sanitize(html));
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return "";
  }
});
</script>

<style scoped>
/* The wrapper is injected into `v-html` output, so it is not touched by scoped
   attribute rewriting — `:deep` is required. */
:deep(.md-table-scroll) {
  max-width: 100%;
  overflow-x: auto;
}
</style>
