<template>
  <q-select
    v-model="selectedValue"
    filled
    :options="items"
    :label="props.label || 'Select an LLM Model'"
    @update:model-value="updateSelection"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { QSelect } from 'quasar';

const items = ref<string[]>([
  'openai-gpt-3.5',
  'openai-gpt-4',
  'llama-2-13b',
  'mistral7b',
]);

const props = defineProps<{
  modelValue?: string;
  label?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const selectedValue = ref(props.modelValue || '');

function updateSelection(value: string) {
  selectedValue.value = value;
  emit('update:modelValue', value);
}
</script>

<style scoped>
/* Add any custom styling here */
</style>
