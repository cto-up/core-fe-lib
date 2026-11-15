<!--
  ThemedSvg — renders user-supplied SVG markup inline, sanitized, and coloured by
  theme ROLES (svgTheme.ts) instead of fixed colours. Inline (not <img>) because
  only inline SVG inherits CSS custom properties, which is how a course theme or
  light/dark mode reaches the drawing. The drawing's own <style> and the optional
  theme stylesheet are confined to this instance.
-->
<template>
  <div
    class="themed-svg w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-full"
    :data-svg-scope="scopeId"
    :style="maxHeight ? { '--themed-svg-max-h': maxHeight } : undefined"
    v-html="markup"
  />
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { sanitizeSvg, scopeCss } from "./svgSanitize";
import { roleClassesCss } from "./svgTheme";

const props = defineProps<{
  svg: string;
  themeCss?: string;
  /** Accessible name. An empty string marks the drawing decorative. */
  title: string;
  desc?: string;
  maxHeight?: string;
}>();

const emit = defineEmits<{ sanitized: [removed: string[]] }>();

let counter = 0;
const scopeId = `ts${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const scopeSel = `[data-svg-scope="${scopeId}"]`;

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const result = computed(() => {
  const removed: string[] = [];
  const { svg, removed: svgRemoved } = sanitizeSvg(props.svg ?? "");
  removed.push(...svgRemoved);
  if (!svg.trim()) return { html: "", removed };

  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg")
    return { html: "", removed: [...removed, "not an svg"] };

  // The drawing's own stylesheets move into the instance's single <style>,
  // scoped to it, so no CSS is parsed inside the SVG by the HTML parser.
  const own: string[] = [];
  for (const style of Array.from(root.querySelectorAll("style"))) {
    own.push(scopeCss(style.textContent ?? "", scopeSel, removed));
    style.remove();
  }

  // Responsive: size comes from the column and the viewBox.
  const w = root.getAttribute("width");
  const h = root.getAttribute("height");
  if (
    !root.getAttribute("viewBox") &&
    w &&
    h &&
    !Number.isNaN(Number.parseFloat(w)) &&
    !Number.isNaN(Number.parseFloat(h))
  ) {
    root.setAttribute(
      "viewBox",
      `0 0 ${Number.parseFloat(w)} ${Number.parseFloat(h)}`
    );
  }
  root.removeAttribute("width");
  root.removeAttribute("height");
  if (props.maxHeight)
    root.setAttribute("style", "max-height:var(--themed-svg-max-h)");

  for (const old of Array.from(
    root.querySelectorAll(":scope > title, :scope > desc")
  ))
    old.remove();
  if (props.title === "") {
    root.setAttribute("aria-hidden", "true");
    root.removeAttribute("role");
  } else {
    root.setAttribute("role", "img");
    const ids = [`${scopeId}-t`];
    if (props.desc) ids.push(`${scopeId}-d`);
    root.setAttribute("aria-labelledby", ids.join(" "));
    root.removeAttribute("aria-hidden");
  }

  let html = new XMLSerializer().serializeToString(root);
  if (props.title !== "") {
    const a11y =
      `<title id="${scopeId}-t">${escapeText(props.title)}</title>` +
      (props.desc
        ? `<desc id="${scopeId}-d">${escapeText(props.desc)}</desc>`
        : "");
    html = html.replace(/<svg\b[^>]*>/, (open) => open + a11y);
  }

  const theme = props.themeCss
    ? scopeCss(props.themeCss, scopeSel, removed)
    : "";
  const styleTag = `<style>${roleClassesCss(scopeSel)}\n${own.join("\n")}\n${theme}</style>`;
  return { html: styleTag + html, removed };
});

const markup = computed(() => result.value.html);

watchEffect(() => {
  const removed = result.value.removed;
  if (!removed.length) return;
  emit("sanitized", removed);
  if (import.meta.env.DEV)
    console.warn("[ThemedSvg] removed unsafe content:", removed);
});
</script>
