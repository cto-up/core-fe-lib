<template>
  <QCard class="q-pa-md" style="max-width: min-content" role="datepicker">
    <QDate
      mask="YYYY-MM-DD"
      :modelValue="modelValue"
      dense
      minimal
      @update:modelValue="onSelectDate"
    ></QDate>
    <QBtn
      color="primary"
      @click="onSelectDate(dashedDate(new Date()))"
      label="Today"
    />
  </QCard>
</template>

<script lang="ts">
import { QBtn, QCard, QDate } from "quasar";

export function dashedDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default {
  emits: ["update:modelValue"],
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
  methods: {
    dashedDate,
    onSelectDate(date: string) {
      this.$emit("update:modelValue", date);
    },
  },
};
</script>
