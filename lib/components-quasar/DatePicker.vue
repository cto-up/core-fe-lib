<template>
  <QCard class="q-pa-md" style="max-width: min-content" role="datepicker">
    <QDate
      mask="YYYY-MM-DD"
      :model-value="modelValue"
      dense
      minimal
      @update:model-value="onSelectDate"
    ></QDate>
    <QBtn
      color="primary"
      label="Today"
      @click="onSelectDate(dashedDate(new Date()))"
    />
  </QCard>
</template>

<script lang="ts">
import { QBtn, QCard, QDate } from "quasar";

export function dashedDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default {
  components: {
    QBtn,
    QCard,
    QDate,
  },
  props: {
    modelValue: {
      type: String,
    },
  },
  emits: ["update:modelValue"],
  methods: {
    dashedDate,
    onSelectDate(date: string) {
      this.$emit("update:modelValue", date);
    },
  },
};
</script>
