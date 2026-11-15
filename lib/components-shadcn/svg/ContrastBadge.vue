<!--
  ContrastBadge — one WCAG contrast pill, shared by every theme preview. Passing
  ratios read quietly; failing ones are orange (an error, not a destructive
  action) and offer the nearest passing shade.
-->
<template>
  <span
    v-if="ratio !== null"
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs"
    :class="ok ? 'bg-muted/60 text-muted-foreground' : 'bg-error/10 text-error'"
    :title="label"
    :aria-label="label"
  >
    <Check v-if="ok" class="h-3 w-3" aria-hidden="true" />
    <TriangleAlert v-else class="h-3 w-3" aria-hidden="true" />
    {{ ratio.toFixed(1) }}:1
    <button
      v-if="!ok && fix && !hideFix"
      type="button"
      class="ml-1 underline underline-offset-2"
      @click="emit('fix', fix)"
    >
      {{ fixLabel }}
    </button>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Check, TriangleAlert } from "lucide-vue-next";
import { contrastOf, nearestPassing, passes } from "./contrast";

const props = withDefaults(
  defineProps<{
    fg: string;
    bg: string;
    kind?: "text" | "shape";
    hideFix?: boolean;
    fixLabel?: string;
    passLabel?: string;
    failLabel?: string;
  }>(),
  {
    kind: "text",
    fixLabel: "Fix",
    passLabel: "Readable contrast",
    failLabel: "Contrast too low",
  }
);

const emit = defineEmits<{ fix: [color: string] }>();

const ratio = computed(() => contrastOf(props.fg, props.bg));
const ok = computed(
  () => ratio.value !== null && passes(ratio.value, props.kind)
);
const fix = computed(() =>
  ok.value ? null : nearestPassing(props.fg, props.bg, props.kind)
);
const label = computed(() =>
  ratio.value === null
    ? ""
    : `${ok.value ? props.passLabel : props.failLabel}: ${ratio.value.toFixed(1)}:1`
);
</script>
