<template>
  <div
    ref="root"
    role="radiogroup"
    :aria-label="label"
    :class="cn('grid gap-0.5', props.class)"
    :style="{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }"
    data-test="week-strip"
    @keydown="onKey"
  >
    <button
      v-for="(day, i) in days"
      :key="isoDate(day)"
      type="button"
      role="radio"
      :aria-checked="sameDay(day, modelValue)"
      :aria-label="dayLabel(day)"
      :tabindex="sameDay(day, modelValue) ? 0 : -1"
      class="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :class="
        sameDay(day, modelValue)
          ? 'bg-primary text-primary-foreground'
          : 'bg-card hover:bg-accent'
      "
      :data-index="i"
      :data-test="`week-strip-${isoDate(day)}`"
      @click="emit('update:modelValue', day)"
    >
      <span class="text-[11px]">{{ weekday(day) }}</span>
      <span class="text-base font-bold">{{ day.getDate() }}</span>
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="
          marked.includes(isoDate(day)) && !sameDay(day, modelValue)
            ? 'bg-muted-foreground'
            : ''
        "
        aria-hidden="true"
        :data-test="
          marked.includes(isoDate(day))
            ? `week-strip-dot-${isoDate(day)}`
            : undefined
        "
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, type HTMLAttributes } from "vue";
import { cn } from "../utils";
import { isoDate, sameDay } from "./layout";

/**
 * A row of days to pick one from (a phone's week): a dot under each day in
 * `marked` (YYYY-MM-DD), arrow keys move the choice.
 */
const props = withDefaults(
  defineProps<{
    modelValue: Date;
    days: Date[];
    marked?: string[];
    locale?: string;
    /** Appended to a marked day's accessible name, e.g. "has meetings". */
    markedLabel?: string;
    label?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    marked: () => [],
    locale: undefined,
    markedLabel: undefined,
    label: undefined,
    class: undefined,
  }
);

const emit = defineEmits<{ "update:modelValue": [day: Date] }>();
const root = ref<HTMLElement>();

const weekday = (d: Date) =>
  new Intl.DateTimeFormat(props.locale, { weekday: "short" }).format(d);

function dayLabel(d: Date) {
  const name = new Intl.DateTimeFormat(props.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return props.markedLabel && props.marked.includes(isoDate(d))
    ? `${name}, ${props.markedLabel}`
    : name;
}

async function onKey(e: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
    e.key
  ];
  if (!step) return;
  e.preventDefault();
  const i = props.days.findIndex((d) => sameDay(d, props.modelValue));
  const next = props.days[i + step];
  if (!next) return;
  emit("update:modelValue", next);
  await nextTick();
  root.value?.querySelector<HTMLElement>(`[data-index="${i + step}"]`)?.focus();
}
</script>
