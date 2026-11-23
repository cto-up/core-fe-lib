<template>
  <div
    role="group"
    :aria-label="label"
    :class="cn('', props.class)"
    data-test="month-grid"
  >
    <div class="grid grid-cols-7 border-b" aria-hidden="true">
      <span
        v-for="d in weeks[0]"
        :key="d.getDay()"
        class="px-3 py-2 text-xs text-muted-foreground"
        >{{ weekday(d) }}</span
      >
    </div>
    <div
      v-for="(week, w) in weeks"
      :key="w"
      class="flex flex-col border-b last:border-b-0"
      :data-test="`month-grid-week-${w}`"
    >
      <div
        v-for="b in bandsInWeek(bands, week)"
        :key="b.item.id"
        class="grid grid-cols-7 px-1 pt-1.5"
        :data-test="`month-grid-band-${b.item.id}`"
      >
        <div :style="{ gridColumn: `${b.from + 1} / ${b.to + 2}` }">
          <slot name="band" :band="b.item" />
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="(day, i) in week"
          :key="isoDate(day)"
          class="flex min-h-28 min-w-0 flex-col gap-0.5 p-1.5"
          :class="[i ? 'border-l' : '', isWeekend(day) ? 'bg-muted/40' : '']"
          :data-test="`month-grid-day-${isoDate(day)}`"
        >
          <span
            class="self-start text-sm"
            :class="[
              sameDay(day, nowDate)
                ? 'rounded-full bg-primary px-2 font-bold text-primary-foreground'
                : '',
              inMonth(day) ? '' : 'text-muted-foreground',
            ]"
            :aria-current="sameDay(day, nowDate) ? 'date' : undefined"
            >{{ day.getDate() }}</span
          >
          <div
            v-for="item in itemsOnDay(items, day).slice(0, maxPerDay)"
            :key="item.id"
            class="min-w-0"
          >
            <slot name="item" :item="item" :day="day" />
          </div>
          <button
            v-if="itemsOnDay(items, day).length > maxPerDay"
            type="button"
            class="min-h-6 self-start rounded px-1 text-left text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :data-test="`month-grid-more-${isoDate(day)}`"
            @click="emit('open-day', day)"
          >
            {{ moreLabel(itemsOnDay(items, day).length - maxPerDay) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
  generic="T extends ScheduleItem, B extends ScheduleItem = ScheduleItem"
>
import { computed, type HTMLAttributes } from "vue";
import { cn } from "../utils";
import {
  bandsInWeek,
  isoDate,
  itemsOnDay,
  monthWeeks,
  sameDay,
  toDate,
  type DateLike,
  type ScheduleItem,
} from "./layout";

/**
 * A month of days in whole weeks: each day lists up to `maxPerDay` items
 * through the `item` slot, then a "+N more" button (`open-day`). `bands` are
 * drawn once per week row across the days they touch (a daily series), by
 * the `band` slot; leave them out of `items`.
 */
const props = withDefaults(
  defineProps<{
    date: DateLike;
    items: T[];
    bands?: B[];
    maxPerDay?: number;
    weekStartsOn?: number;
    now?: DateLike;
    locale?: string;
    moreLabel?: (n: number) => string;
    label?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    bands: () => [],
    maxPerDay: 3,
    weekStartsOn: 1,
    now: () => Date.now(),
    locale: undefined,
    moreLabel: (n: number) => `+${n}`,
    label: undefined,
    class: undefined,
  }
);

const emit = defineEmits<{ "open-day": [day: Date] }>();

defineSlots<{
  item(props: { item: T; day: Date }): unknown;
  band(props: { band: B }): unknown;
}>();

const weeks = computed(() => monthWeeks(props.date, props.weekStartsOn));
const nowDate = computed(() => toDate(props.now));
const inMonth = (d: Date) => d.getMonth() === toDate(props.date).getMonth();
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const weekday = (d: Date) =>
  new Intl.DateTimeFormat(props.locale, { weekday: "short" }).format(d);
</script>
