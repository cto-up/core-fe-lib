<template>
  <Select v-model="selectedModel" @update:model-value="updateModel">
    <SelectTrigger>
      <SelectValue :placeholder="label" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="model in availableModels" :key="model" :value="model">
        {{ model }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { providerModels } from "./providers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: "AI Model",
  },
});

const emit = defineEmits(["update:modelValue"]);

const selectedModel = ref(props.modelValue);

const availableModels = computed(() => {
  return (providerModels as any)[props.provider] || [];
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedModel.value = newValue;
  }
);

watch(
  () => props.provider,
  () => {
    // When provider changes, select the first model from the new provider
    if (availableModels.value.length > 0) {
      selectedModel.value = availableModels.value[0];
      emit("update:modelValue", selectedModel.value);
    }
  }
);

function updateModel(value: string) {
  emit("update:modelValue", value);
}
</script>
