<template>
  <div class="flex flex-col gap-2">
    <Label v-if="label">{{ label }}</Label>
    <Select v-model="selectedCurrency">
      <SelectTrigger>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in options" :key="option" :value="option">
          {{ option }}
        </SelectItem>
      </SelectContent>
    </Select>
    <p v-if="error && errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

const props = defineProps({
  label: {
    type: String,
    default: "Currency",
  },
  modelValue: {
    type: String,
    default: "EUR",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessages: {
    type: Array as () => Array<{ $message: string }>,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const options = ["EUR", "USD", "VND", "RON"];
const selectedCurrency = ref(props.modelValue || "EUR");

const errorMessage = computed(() => {
  if (props.errorMessages) {
    return props.errorMessages.map((e) => e.$message).join(" ");
  }
  return "";
});

watch(selectedCurrency, (newValue) => {
  emit("update:modelValue", newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectedCurrency.value = newValue;
    }
  }
);
</script>
