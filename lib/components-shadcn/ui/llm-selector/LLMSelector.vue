<template>
  <div class="space-y-2">
    <Label v-if="label">{{ label }}</Label>
    <Select v-model="selectedValue" @update:model-value="updateSelection">
      <SelectTrigger>
        <SelectValue :placeholder="label || 'Select an LLM Model'" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="item in items" :key="item" :value="item">
          {{ item }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { Label } from "../label";

const items = ref<string[]>([
  "openai-gpt-3.5",
  "openai-gpt-4",
  "openai-gpt-4-turbo",
  "openai-gpt-4o",
  "llama-2-13b",
  "llama-2-70b",
  "mistral7b",
  "mistral-medium",
  "claude-3-opus",
  "claude-3-sonnet",
]);

const props = defineProps<{
  modelValue?: string;
  label?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const selectedValue = ref(props.modelValue || "");

function updateSelection(value: string) {
  selectedValue.value = value;
  emit("update:modelValue", value);
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== selectedValue.value) {
      selectedValue.value = newValue || "";
    }
  }
);
</script>
