<template>
  <div
    ref="scroller"
    role="group"
    :aria-label="label"
    :class="cn('select-none overflow-y-auto', props.class)"
    :style="{
      maxHeight: `${visibleHours * hourHeight + (showHeader ? 48 : 0)}px`,
    }"
    data-test="time-grid"
  >
    <div
      v-if="showHeader"
      class="sticky top-0 z-10 grid border-b bg-card"
      :style="{ gridTemplateColumns: columnsTemplate }"
    >
      <span />
      <div
        v-for="day in days"
        :key="isoDate(day)"
        class="flex items-baseline gap-1.5 border-l px-3 py-2"
        :data-test="`time-grid-head-${isoDate(day)}`"
      >
        <slot name="header" :day="day" :today="sameDay(day, nowDate)">
          <span class="text-xs text-muted-foreground">{{ weekday(day) }}</span>
          <span
            class="text-base font-bold"
            :class="
              sameDay(day, nowDate)
                ? 'rounded-full bg-primary px-2 text-primary-foreground'
                : ''
            "
            :aria-current="sameDay(day, nowDate) ? 'date' : undefined"
            >{{ day.getDate() }}</span
          >
        </slot>
      </div>
    </div>
    <div class="grid" :style="{ gridTemplateColumns: columnsTemplate }">
      <div
        class="relative"
        :style="{ height: `${height}px` }"
        aria-hidden="true"
      >
        <span
          v-for="h in hours"
          :key="h"
          class="absolute left-2 right-2 whitespace-nowrap text-right font-mono text-[11px] text-muted-foreground"
          :style="{ top: `${Math.max(0, (h - startHour) * hourHeight - 7)}px` }"
          >{{ hourLabel(h) }}</span
        >
      </div>
      <div
        v-for="day in days"
        :key="isoDate(day)"
        class="relative border-l"
        :class="selectable ? 'cursor-cell' : ''"
        :style="{
          height: `${height}px`,
          backgroundImage: `repeating-linear-gradient(to bottom, hsl(var(--border)) 0, hsl(var(--border)) 1px, transparent 1px, transparent ${hourHeight}px)`,
        }"
        :data-test="`time-grid-day-${isoDate(day)}`"
        @pointerdown="onDown($event, day)"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="drag = null"
      >
        <div
          v-for="p in placed(day)"
          :key="p.item.id"
          class="absolute p-px"
          :style="{
            top: `${p.top}px`,
            height: `${p.height}px`,
            left: `calc(${(p.column / p.columns) * 100}% + 2px)`,
            width: `calc(${100 / p.columns}% - 4px)`,
          }"
          :data-test="`time-grid-item-${p.item.id}`"
          @pointerdown.stop
        >
          <slot name="item" :item="p.item" :placement="p" />
        </div>
        <div
          v-if="drag && sameDay(drag.day, day)"
          class="pointer-events-none absolute inset-x-1 rounded-md bg-primary/15 ring-2 ring-primary"
          :style="selectionStyle"
          data-test="time-grid-selection"
        />
        <template v-if="nowOffset(nowDate, day, win) !== null">
          <div
            class="pointer-events-none absolute inset-x-0 h-0.5 bg-primary"
            :style="{ top: `${nowOffset(nowDate, day, win)}px` }"
            aria-hidden="true"
            data-test="time-grid-now"
          />
          <div
            class="pointer-events-none absolute -left-1.5 h-2.5 w-2.5 rounded-full bg-primary"
            :style="{ top: `${nowOffset(nowDate, day, win)! - 4}px` }"
            aria-hidden="true"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends ScheduleItem">
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
  type HTMLAttributes,
} from "vue";
import { cn } from "../utils";
import {
  isoDate,
  nowOffset,
  placeInDay,
  sameDay,
  timeAt,
  toDate,
  windowHeight,
  type DateLike,
  type Placement,
  type ScheduleItem,
} from "./layout";

/**
 * Days side by side on an hour axis (a week, or one day): each item placed
 * by its start and end and drawn by the `item` slot, overlaps side by side,
 * a now line on today. Pressing on an empty slot and dragging selects a
 * range (`select-range`); a press without a drag selects `defaultMinutes`.
 */
const props = withDefaults(
  defineProps<{
    days: Date[];
    items: T[];
    startHour?: number;
    endHour?: number;
    hourHeight?: number;
    /** The hour shown at the top when the grid opens, unless an item starts earlier. */
    scrollToHour?: number;
    /** How many hours the grid shows before it scrolls. */
    visibleHours?: number;
    /** Minimum height of an item, in px. */
    minItemHeight?: number;
    now?: DateLike;
    locale?: string;
    /** Minutes a selection snaps to. */
    snapMinutes?: number;
    /** Length of a selection made by a press without a drag. */
    defaultMinutes?: number;
    selectable?: boolean;
    showHeader?: boolean;
    label?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    startHour: 0,
    endHour: 24,
    hourHeight: 60,
    scrollToHour: 8,
    visibleHours: 10,
    minItemHeight: 22,
    now: () => Date.now(),
    locale: undefined,
    snapMinutes: 15,
    defaultMinutes: 30,
    selectable: true,
    showHeader: true,
    label: undefined,
    class: undefined,
  }
);

const emit = defineEmits<{
  "select-range": [range: { start: Date; end: Date }];
}>();

defineSlots<{
  item(props: { item: T; placement: Placement<T> }): unknown;
  header(props: { day: Date; today: boolean }): unknown;
}>();

const win = computed(() => ({
  startHour: props.startHour,
  endHour: props.endHour,
  hourHeight: props.hourHeight,
}));
const height = computed(() => windowHeight(win.value));
const nowDate = computed(() => toDate(props.now));
const columnsTemplate = computed(
  () => `4rem repeat(${props.days.length}, minmax(0, 1fr))`
);
const hours = computed(() =>
  Array.from(
    { length: props.endHour - props.startHour },
    (_, i) => props.startHour + i
  )
);

const scroller = ref<HTMLElement | null>(null);
/** Opens on scrollToHour, or earlier when an item of these days starts before it. */
function scrollToFirst() {
  const el = scroller.value;
  if (!el) return;
  let hour = props.scrollToHour;
  for (const it of props.items) {
    const start = toDate(it.start);
    if (props.days.some((d) => sameDay(d, start)))
      hour = Math.min(hour, start.getHours());
  }
  el.scrollTop = Math.max(0, hour - props.startHour) * props.hourHeight;
}
onMounted(scrollToFirst);
watch(
  () => [props.days.map(isoDate).join(), props.items.length],
  () => nextTick(scrollToFirst)
);

const placed = (day: Date) =>
  placeInDay(props.items, day, win.value, props.minItemHeight);

const weekday = (d: Date) =>
  new Intl.DateTimeFormat(props.locale, { weekday: "short" }).format(d);
const hourLabel = (h: number) =>
  new Intl.DateTimeFormat(props.locale, {
    hour: "numeric",
  }).format(new Date(2000, 0, 1, h));

const drag = ref<{
  day: Date;
  el: HTMLElement;
  from: number;
  to: number;
  moved: boolean;
} | null>(null);

const yOf = (e: PointerEvent, el: HTMLElement) =>
  e.clientY - el.getBoundingClientRect().top;

function onDown(e: PointerEvent, day: Date) {
  if (!props.selectable || e.button !== 0) return;
  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture?.(e.pointerId);
  const y = yOf(e, el);
  drag.value = { day, el, from: y, to: y, moved: false };
}

function onMove(e: PointerEvent) {
  if (!drag.value) return;
  drag.value.to = yOf(e, drag.value.el);
  if (Math.abs(drag.value.to - drag.value.from) > 4) drag.value.moved = true;
}

const range = computed(() => {
  const d = drag.value;
  if (!d) return null;
  const snap = props.snapMinutes;
  const a = timeAt(Math.min(d.from, d.to), d.day, win.value, snap);
  if (!d.moved)
    return {
      start: a,
      end: new Date(a.getTime() + props.defaultMinutes * 60_000),
    };
  const b = timeAt(Math.max(d.from, d.to), d.day, win.value, snap, "up");
  return { start: a, end: b > a ? b : new Date(a.getTime() + snap * 60_000) };
});

const selectionStyle = computed(() => {
  const r = range.value;
  if (!r || !drag.value?.moved) return { display: "none" };
  const pxPerMs = props.hourHeight / 3_600_000;
  const dayStart = new Date(r.start).setHours(
    props.startHour,
    0,
    0,
    0
  ) as number;
  return {
    top: `${(r.start.getTime() - dayStart) * pxPerMs}px`,
    height: `${(r.end.getTime() - r.start.getTime()) * pxPerMs}px`,
  };
});

function onUp() {
  const r = range.value;
  drag.value = null;
  if (r) emit("select-range", r);
}
</script>
