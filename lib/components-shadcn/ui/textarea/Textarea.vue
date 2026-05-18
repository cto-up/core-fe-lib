<script setup lang="ts">
import { ref, onMounted, watch, type HTMLAttributes } from "vue";
import { useVModel } from "@vueuse/core";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  defaultValue?: string | number;
  modelValue?: string | number;
  autosize?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function adjustHeight() {
  if (props.autosize && textareaRef.value) {
    textareaRef.value.style.height = "auto";
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
}

onMounted(() => {
  if (props.autosize) {
    adjustHeight();
  }
});

watch(modelValue, () => {
  if (props.autosize) {
    adjustHeight();
  }
});
</script>

<template>
  <textarea
    ref="textareaRef"
    v-model="modelValue"
    :class="
      cn(
        'flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
    @input="adjustHeight"
  />
</template>
