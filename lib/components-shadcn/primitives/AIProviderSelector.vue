<template>
  <Select v-model="selectedProvider" @update:model-value="updateProvider">
    <SelectTrigger>
      <SelectValue :placeholder="label" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="provider in providers"
        :key="provider"
        :value="provider"
      >
        {{ provider }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { providers } from "./providers";
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
  label: {
    type: String,
    default: "AI Provider",
  },
});

const emit = defineEmits(["update:modelValue"]);
const selectedProvider = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedProvider.value = newValue;
  }
);

function updateProvider(value: string) {
  emit("update:modelValue", value);
}
</script>
