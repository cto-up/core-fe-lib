<template>
  <PeriodDateTimePicker
    :from-date="fromDate"
    :to-date="toDate"
    :error="error"
    :label="label"
    :duration-label="computedDurationLabel"
    :error-message="errorMessage"
    :max-width="maxWidth"
    @update:from-date="emit('update:fromDate', $event)"
    @update:to-date="emit('update:toDate', $event)"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { PeriodDateTimePicker } from "../ui/period-datetime-picker";

const { t } = useI18n();

const props = defineProps({
  fromDate: {
    type: String,
    default: "",
    required: true,
  },
  toDate: {
    type: String,
    default: "",
    required: true,
  },
  error: {
    type: Boolean,
  },
  label: {
    type: String,
    default: "Date Time",
  },
  durationLabel: {
    type: String,
    default: "",
  },
  errorMessage: {
    type: String,
  },
  maxWidth: {
    type: String,
    default: "100%",
  },
});

const emit = defineEmits(["update:fromDate", "update:toDate"]);

// Compute the duration label with fallback
const computedDurationLabel = computed(
  () => props.durationLabel || t("entities.common.duration")
);
</script>
