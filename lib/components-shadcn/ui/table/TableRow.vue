<template>
  <tr
    :class="
      cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        clickable &&
          'cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
      )
    "
    :tabindex="clickable ? 0 : undefined"
    @click="onClick"
    @keydown.enter="onEnter"
  >
    <slot />
  </tr>
</template>

<script setup lang="ts">
import { cn } from "../../utils";

const props = defineProps<{
  /** The whole row opens its item: emits `activate` on click or Enter. */
  clickable?: boolean;
}>();

const emit = defineEmits<{
  activate: [event: MouseEvent | KeyboardEvent];
}>();

// A click on a control inside the row belongs to that control, so in-row
// buttons need no @click.stop.
const INTERACTIVE =
  "a, button, input, select, textarea, label, summary, [role=button], [role=switch], [role=checkbox], [role=menuitem], [role=combobox], [data-row-ignore]";

function onClick(e: MouseEvent) {
  if (!props.clickable) return;
  // Modified clicks are left to a link in the row (new tab, new window).
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  // Selecting text to copy it ends in a click; that is not an open.
  if (window.getSelection()?.toString()) return;
  // The path as dispatched, not the live DOM: a control that re-renders on
  // its own click (a Test button swapping its icon for a spinner) has left
  // the tree by the time the click bubbles here, and closest() from a
  // detached node finds nothing.
  const row = e.currentTarget as HTMLElement;
  for (const el of e.composedPath()) {
    if (el === row) break;
    if (el instanceof Element && el.matches(INTERACTIVE)) return;
  }
  emit("activate", e);
}

function onEnter(e: KeyboardEvent) {
  if (!props.clickable || e.target !== e.currentTarget) return;
  emit("activate", e);
}
</script>
