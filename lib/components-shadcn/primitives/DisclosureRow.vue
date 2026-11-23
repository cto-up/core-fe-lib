<template>
  <div class="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1">
    <span
      :class="cn('min-w-0 flex-1 text-sm', props.summaryClass)"
      :data-test="`${testId}-summary`"
      >{{ summary }}</span
    >
    <Button
      type="button"
      variant="link"
      class="h-auto min-h-11 p-0"
      :aria-expanded="open"
      :aria-controls="controls"
      :data-test="`${testId}-change`"
      @click="open = !open"
    >
      {{ open ? doneLabel : changeLabel }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Button } from "../ui/button";
import { cn } from "../utils";

/**
 * "45 min · Team sync · Call, Page" [Change]: what is set, in one line, and
 * the button that shows the fields behind it (`controls` is their id).
 */
const props = defineProps<{
  summary: string;
  controls: string;
  /** Prefix of the data-test of the summary and the button. */
  testId: string;
  changeLabel: string;
  doneLabel: string;
  summaryClass?: HTMLAttributes["class"];
}>();
const open = defineModel<boolean>("open", { default: false });
</script>
