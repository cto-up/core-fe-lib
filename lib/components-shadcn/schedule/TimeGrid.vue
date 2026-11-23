<template>
  <div
    ref="scroller"
    role="group"
    :aria-label="label"
    :class="
      cn(
        'select-none overflow-y-auto',
        moving?.moved &&
          (moving.mode === 'move' ? 'cursor-grabbing' : 'cursor-ns-resize'),
        props.class
      )
    "
    :style="{
      maxHeight: `${visibleHours * hourHeight + (showHeader ? 48 : 0)}px`,
    }"
    data-test="time-grid"
    @pointermove="onItemMove"
    @pointerup="onItemUp"
    @pointercancel="moving = null"
    @click.capture="swallowClickAfterMove"
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
        v-for="(day, i) in days"
        :key="isoDate(day)"
        :ref="(el) => (columns[i] = el as HTMLElement)"
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
          :class="[
            canMove(p.item) && !moving?.moved ? 'cursor-grab' : '',
            moving?.moved && moving.item.id === p.item.id
              ? 'z-20 opacity-90 shadow-lg'
              : '',
          ]"
          :style="{
            top: `${p.top}px`,
            height: `${p.height}px`,
            left: `calc(${(p.column / p.columns) * 100}% + 2px)`,
            width: `calc(${100 / p.columns}% - 4px)`,
          }"
          :data-test="`time-grid-item-${p.item.id}`"
          :data-movable="canMove(p.item) || undefined"
          @pointerdown.stop="startMove($event, p.item, day, 'move')"
        >
          <slot name="item" :item="p.item" :placement="p" />
          <div
            v-if="canMove(p.item)"
            class="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
            aria-hidden="true"
            :data-test="`time-grid-resize-${p.item.id}`"
            @pointerdown.stop="startMove($event, p.item, day, 'resize')"
          />
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
  startOfDay,
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
 * A `movable` item is dragged to another time or day, or by its bottom edge
 * to another end (`move-item`); a press without a drag still clicks it.
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
    /** Which items can be moved and resized by dragging; none by default. */
    movable?: (item: T) => boolean;
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
    movable: undefined,
    showHeader: true,
    label: undefined,
    class: undefined,
  }
);

const emit = defineEmits<{
  "select-range": [range: { start: Date; end: Date }];
  "move-item": [move: { item: T; start: Date; end: Date }];
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
// Re-opens only on other days, or when the first items arrive: a string key,
// so a refreshed items array leaves the user's scroll alone.
watch(
  () => `${props.days.map(isoDate).join()}|${props.items.length > 0}`,
  () => nextTick(scrollToFirst)
);

const placed = (day: Date) =>
  placeInDay(shown.value, day, win.value, props.minItemHeight);

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

const columns: HTMLElement[] = [];
const canMove = (item: T) => !!props.movable?.(item);
const HOUR = 3_600_000;

const moving = ref<{
  item: T;
  mode: "move" | "resize";
  x0: number;
  y0: number;
  day: number;
  /** Where in the item it was taken, in ms after its start. */
  grab: number;
  start: Date;
  end: Date;
  moved: boolean;
} | null>(null);
let justMoved = false;

/** The items, the one being dragged drawn where it would land. */
const shown = computed(() => {
  const m = moving.value;
  if (!m?.moved) return props.items;
  return props.items.map((it) =>
    it.id === m.item.id ? { ...it, start: m.start, end: m.end } : it
  );
});

const msAt = (y: number, day: Date) =>
  startOfDay(day).getTime() +
  props.startHour * HOUR +
  (y / props.hourHeight) * HOUR;

function startMove(
  e: PointerEvent,
  item: T,
  day: Date,
  mode: "move" | "resize"
) {
  if (e.button !== 0 || !canMove(item)) return;
  const i = props.days.findIndex((d) => sameDay(d, day));
  const start = toDate(item.start);
  moving.value = {
    item,
    mode,
    x0: e.clientX,
    y0: e.clientY,
    day: i,
    grab: msAt(yOf(e, columns[i]), day) - start.getTime(),
    start,
    end: toDate(item.end),
    moved: false,
  };
}

const dayUnder = (x: number) =>
  columns.findIndex((el) => {
    const r = el?.getBoundingClientRect();
    return !!r && x >= r.left && x < r.right;
  });

function onItemMove(e: PointerEvent) {
  const m = moving.value;
  if (!m) return;
  if (!m.moved) {
    if (Math.hypot(e.clientX - m.x0, e.clientY - m.y0) < 4) return;
    m.moved = true;
    // Captured only once it moves, so a plain press still clicks the item.
    scroller.value?.setPointerCapture?.(e.pointerId);
  }
  const was = { start: toDate(m.item.start), end: toDate(m.item.end) };
  const snap = props.snapMinutes * 60_000;
  if (m.mode === "resize") {
    const i = props.days.findIndex((d) => sameDay(d, was.start));
    const end = timeAt(
      yOf(e, columns[i]),
      was.start,
      win.value,
      props.snapMinutes,
      "up"
    );
    m.end = new Date(Math.max(end.getTime(), was.start.getTime() + snap));
    return;
  }
  const under = dayUnder(e.clientX);
  if (under >= 0) m.day = under;
  const day = props.days[m.day];
  const length = was.end.getTime() - was.start.getTime();
  const from = startOfDay(day).getTime() + props.startHour * HOUR;
  const to = startOfDay(day).getTime() + props.endHour * HOUR - length;
  const start =
    Math.round((msAt(yOf(e, columns[m.day]), day) - m.grab) / snap) * snap;
  const at = Math.min(Math.max(start, from), Math.max(from, to));
  m.start = new Date(at);
  m.end = new Date(at + length);
}

function onItemUp() {
  const m = moving.value;
  moving.value = null;
  if (!m?.moved) return;
  justMoved = true;
  setTimeout(() => (justMoved = false));
  if (
    m.start.getTime() !== toDate(m.item.start).getTime() ||
    m.end.getTime() !== toDate(m.item.end).getTime()
  )
    emit("move-item", { item: m.item as T, start: m.start, end: m.end });
}

function swallowClickAfterMove(e: MouseEvent) {
  if (!justMoved) return;
  e.stopPropagation();
  e.preventDefault();
}
</script>
