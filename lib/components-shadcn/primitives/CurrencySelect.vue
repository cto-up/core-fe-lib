<template>
  <Select v-model="selected" @update:model-value="onUpdate">
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="c in currencies" :key="c" :value="c">
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

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    /**
     * The codes on offer. Defaults to EUR alone — what this component has
     * always shown — because what a consumer can actually charge in is decided
     * by its own payment integration, not by this list. A consumer that settles
     * in more currencies passes its own set rather than widening the default
     * for everyone.
     */
    currencies?: readonly string[];
  }>(),
  {
    modelValue: "EUR",
    placeholder: "Currency",
    currencies: () => ["EUR"],
  }
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
