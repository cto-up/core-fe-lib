<template>
  <Select v-model="selected" @update:model-value="onUpdate">
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="c in CURRENCIES" :key="c" :value="c">
        {{ c }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Supported currencies. Only EUR for now — extend this list as billing grows.
const CURRENCIES = ["EUR"] as const;

const props = withDefaults(
  defineProps<{ modelValue?: string; placeholder?: string }>(),
  { modelValue: "EUR", placeholder: "Currency" }
);

const emit = defineEmits<{ "update:modelValue": [string] }>();
const selected = ref(props.modelValue || "EUR");

watch(
  () => props.modelValue,
  (v) => {
    if (v) selected.value = v;
  }
);

function onUpdate(value: unknown) {
  emit("update:modelValue", String(value));
}
</script>
