<template>
  <span v-if="loading" class="text-muted-foreground">Loading...</span>
  <span v-else-if="error" class="text-destructive">Error loading</span>
  <span v-else>{{ theModel[optionLabel] || "-" }}</span>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watch } from "vue";
import { useToast } from "../toast";

const props = defineProps<{
  modelValue?: string;
  optionValue: string;
  optionLabel: string;
  url: string;
}>();

const { toast } = useToast();

const loading = ref(false);
const error = ref(false);
const theModel = ref<Record<string, any>>({
  [props.optionValue]: props.modelValue,
  [props.optionLabel]: "",
});

const loadOne = async (newValue: string | undefined) => {
  if (!newValue) {
    theModel.value = {
      [props.optionValue]: "",
      [props.optionLabel]: "",
    };
    return;
  }

  loading.value = true;
  error.value = false;

  try {
    const { data } = await axios.get(`${props.url}/${newValue}`);
    theModel.value = {
      [props.optionValue]: data[props.optionValue],
      [props.optionLabel]: data[props.optionLabel],
    };
  } catch (err) {
    console.error("Failed to load data:", err);
    error.value = true;
    toast({
      title: "Failed to load data",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  (newValue) => loadOne(newValue),
  { immediate: true }
);
</script>
