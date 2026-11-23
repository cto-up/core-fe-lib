<template>
  <div
    role="group"
    :aria-label="label"
    class="flex flex-wrap gap-1.5"
    :data-test="testIdPrefix"
  >
    <Toggle
      v-for="d in WEEK_DAYS"
      :key="d"
      :pressed="modelValue.includes(d)"
      variant="outline"
      class="min-h-11 min-w-11 bg-background"
      :aria-label="dayName(d, 'long')"
      :data-test="`${testIdPrefix}-${d}`"
      @update:pressed="(on: boolean) => toggle(d, on)"
    >
      {{ dayName(d, "short") }}
    </Toggle>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Toggle } from "../ui/toggle";
import { WEEK_DAYS, type WeekDay } from "./day-toggle-group";

/** Days of the week, Monday first, each a toggle named in the reader's
 * language; the value keeps week order. */
const props = defineProps<{
  modelValue: WeekDay[];
  label: string;
  testIdPrefix: string;
}>();
const emit = defineEmits<{ "update:modelValue": [days: WeekDay[]] }>();
const { locale } = useI18n();

/** Monday 2024-01-01 is day 0. */
const dayName = (d: WeekDay, width: "long" | "short") =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: width,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, 0, 1 + WEEK_DAYS.indexOf(d), 12)));

function toggle(d: WeekDay, on: boolean) {
  const days = new Set(props.modelValue);
  if (on) days.add(d);
  else days.delete(d);
  emit(
    "update:modelValue",
    WEEK_DAYS.filter((x) => days.has(x))
  );
}
</script>
